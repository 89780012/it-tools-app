package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
)

func readProxyInput(w http.ResponseWriter, r *http.Request) (proxyRequest, io.Reader, error) {
	var input proxyRequest
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
		return input, nil, decodeJSON(w, r, &input)
	}
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return input, nil, err
	}
	defer r.MultipartForm.RemoveAll()
	if err := json.Unmarshal([]byte(r.FormValue("request")), &input); err != nil {
		return input, nil, err
	}
	input.Method = strings.TrimSpace(input.Method)
	if input.Method == "" || strings.EqualFold(input.Method, "GET") || strings.EqualFold(input.Method, "HEAD") {
		return input, nil, errors.New("multipart requires a body-capable method")
	}
	var fields [][2]string
	var fileFields []string
	if err := json.Unmarshal([]byte(r.FormValue("fields")), &fields); err != nil {
		return input, nil, err
	}
	if err := json.Unmarshal([]byte(r.FormValue("fileFields")), &fileFields); err != nil {
		return input, nil, err
	}
	files := r.MultipartForm.File["files"]
	if len(files) != len(fileFields) || len(files) > 20 || len(fields) > 100 {
		return input, nil, errors.New("invalid multipart fields")
	}
	var totalFileBytes int64
	for _, header := range files {
		totalFileBytes += header.Size
	}
	if totalFileBytes > 8<<20 {
		return input, nil, errors.New("files exceed 8 MiB limit")
	}
	var output bytes.Buffer
	writer := multipart.NewWriter(&output)
	for _, field := range fields {
		if field[0] == "" || len(field[0]) > 1000 {
			return input, nil, errors.New("invalid field name")
		}
		if err := writer.WriteField(field[0], field[1]); err != nil {
			return input, nil, err
		}
	}
	for index, header := range files {
		if fileFields[index] == "" || len(fileFields[index]) > 1000 {
			return input, nil, errors.New("invalid field name")
		}
		partHeaders := make(textproto.MIMEHeader)
		partHeaders.Set("Content-Disposition", mime.FormatMediaType("form-data", map[string]string{"name": fileFields[index], "filename": header.Filename}))
		contentType := header.Header.Get("Content-Type")
		if _, _, err := mime.ParseMediaType(contentType); err != nil {
			contentType = "application/octet-stream"
		}
		partHeaders.Set("Content-Type", contentType)
		part, err := writer.CreatePart(partHeaders)
		if err != nil {
			return input, nil, err
		}
		file, err := header.Open()
		if err != nil {
			return input, nil, err
		}
		_, copyErr := io.Copy(part, file)
		file.Close()
		if copyErr != nil {
			return input, nil, copyErr
		}
	}
	if err := writer.Close(); err != nil {
		return input, nil, err
	}
	if input.Headers == nil {
		input.Headers = map[string]string{}
	}
	for name := range input.Headers {
		if strings.EqualFold(name, "Content-Type") {
			delete(input.Headers, name)
		}
	}
	input.Headers["Content-Type"] = writer.FormDataContentType()
	input.Data = nil
	return input, &output, nil
}
