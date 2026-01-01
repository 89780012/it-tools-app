import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { filterCommands, countCommands, CATEGORY_ORDER, type AllCommands } from '../filter-utils'

// Arbitrary for generating valid command data
const commandArb = fc.record({
  cmd: fc.string({ minLength: 1 }),
  desc: fc.string({ minLength: 1 }),
})

const categoryArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }),
  commandArb
)

const allCommandsArb = fc.record(
  Object.fromEntries(
    CATEGORY_ORDER.map(cat => [cat, categoryArb])
  )
) as fc.Arbitrary<AllCommands>

// Sample test data for deterministic tests
const sampleCommands: AllCommands = {
  containers: {
    run: { cmd: 'docker run IMAGE', desc: 'Run a container' },
    ps: { cmd: 'docker ps', desc: 'List containers' },
    stop: { cmd: 'docker stop CONTAINER', desc: 'Stop a container' },
  },
  images: {
    pull: { cmd: 'docker pull IMAGE', desc: 'Pull an image' },
    build: { cmd: 'docker build .', desc: 'Build an image' },
  },
  volumes: {
    create: { cmd: 'docker volume create', desc: 'Create a volume' },
  },
  networks: {},
  compose: {
    up: { cmd: 'docker compose up', desc: 'Start services' },
  },
  system: {},
  registry: {},
  build: {},
}

describe('Docker Cheatsheet Filter Utils', () => {
  /**
   * Feature: docker-cheatsheet, Property 1: Category Filter Correctness
   * For any category selection, all displayed commands should belong to that selected category.
   * Validates: Requirements 1.2
   */
  describe('Property 1: Category Filter Correctness', () => {
    it('should only return commands from the selected category', () => {
      fc.assert(
        fc.property(
          allCommandsArb,
          fc.constantFrom(...CATEGORY_ORDER),
          (commands, selectedCategory) => {
            const result = filterCommands(commands, '', selectedCategory)
            
            // All returned categories should be the selected category
            const returnedCategories = Object.keys(result)
            return returnedCategories.every(cat => cat === selectedCategory)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return all categories when no category is selected', () => {
      const result = filterCommands(sampleCommands, '', null)
      const nonEmptyCategories = CATEGORY_ORDER.filter(
        cat => sampleCommands[cat] && Object.keys(sampleCommands[cat]).length > 0
      )
      expect(Object.keys(result).sort()).toEqual(nonEmptyCategories.sort())
    })
  })


  /**
   * Feature: docker-cheatsheet, Property 3: Search Filter Correctness
   * For any search query, all displayed commands should contain the query string
   * in either the command text or description.
   * Validates: Requirements 2.1
   */
  describe('Property 3: Search Filter Correctness', () => {
    it('should only return commands matching the search query', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 5 }),
          (query) => {
            const result = filterCommands(sampleCommands, query, null)
            const lowerQuery = query.toLowerCase().trim()
            
            if (!lowerQuery) return true
            
            // All returned commands should contain the query
            for (const category of Object.values(result)) {
              for (const command of Object.values(category)) {
                const matchesCmd = command.cmd.toLowerCase().includes(lowerQuery)
                const matchesDesc = command.desc.toLowerCase().includes(lowerQuery)
                if (!matchesCmd && !matchesDesc) {
                  return false
                }
              }
            }
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return matching commands for known query', () => {
      const result = filterCommands(sampleCommands, 'container', null)
      expect(result.containers).toBeDefined()
      expect(Object.keys(result.containers || {}).length).toBeGreaterThan(0)
    })
  })

  /**
   * Feature: docker-cheatsheet, Property 4: Case-Insensitive Search
   * For any search query, searching with uppercase, lowercase, or mixed case
   * should return the same results.
   * Validates: Requirements 2.2
   */
  describe('Property 4: Case-Insensitive Search', () => {
    it('should return same results regardless of case', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          (query) => {
            const lowerResult = filterCommands(sampleCommands, query.toLowerCase(), null)
            const upperResult = filterCommands(sampleCommands, query.toUpperCase(), null)
            const mixedResult = filterCommands(sampleCommands, query, null)
            
            // Count should be the same
            const lowerCount = countCommands(lowerResult)
            const upperCount = countCommands(upperResult)
            const mixedCount = countCommands(mixedResult)
            
            return lowerCount === upperCount && upperCount === mixedCount
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should find "DOCKER" same as "docker"', () => {
      const lowerResult = filterCommands(sampleCommands, 'docker', null)
      const upperResult = filterCommands(sampleCommands, 'DOCKER', null)
      
      expect(countCommands(lowerResult)).toBe(countCommands(upperResult))
    })
  })

  /**
   * Feature: docker-cheatsheet, Property 5: Search Count Accuracy
   * For any search query, the displayed total count should equal
   * the actual number of filtered commands.
   * Validates: Requirements 2.4
   */
  describe('Property 5: Search Count Accuracy', () => {
    it('should return accurate count of filtered commands', () => {
      fc.assert(
        fc.property(
          allCommandsArb,
          fc.string({ maxLength: 5 }),
          (commands, query) => {
            const result = filterCommands(commands, query, null)
            const count = countCommands(result)
            
            // Manually count commands
            let manualCount = 0
            for (const category of Object.values(result)) {
              manualCount += Object.keys(category).length
            }
            
            return count === manualCount
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
