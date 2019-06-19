import {omit} from 'lodash'
import {resolveInitialValue, getTemplates} from '../src/initial-values'
import T from '../template-builder'

beforeEach(() => {
  jest.resetModules()
})

const example = {
  id: 'author',
  title: 'Author',
  schemaType: 'author',
  value: {title: 'here'}
}

describe('resolveInitialValue', () => {
  test('serializes builders', () => {
    expect(resolveInitialValue(T.template(example))).resolves.toMatchObject({title: 'here'})
  })

  test('works with raw templates', () => {
    expect(resolveInitialValue(example)).resolves.toMatchObject({title: 'here'})
  })

  test('throws on missing template `value` prop', () => {
    expect(resolveInitialValue(omit(example, ['value']))).rejects.toMatchObject({
      message: 'Template "author" has invalid "value" property'
    })
  })

  test('throws on non-function/non-object template `value` prop', () => {
    expect(resolveInitialValue({...example, value: []})).rejects.toMatchObject({
      message:
        'Template "author" has invalid "value" property - must be a plain object or a resolver function'
    })
  })

  test('throws on wrong `_type`  prop', () => {
    expect(resolveInitialValue({...example, value: {_type: 'foo'}})).rejects.toMatchObject({
      message:
        'Template "author" initial value: includes "_type"-property (foo) that does not match template (author)'
    })
  })

  test('should call sync value resolvers', () => {
    expect(resolveInitialValue({...example, value: () => example.value})).resolves.toMatchObject({
      title: 'here'
    })
  })

  test('should call async value resolvers', () => {
    expect(
      resolveInitialValue({...example, value: () => Promise.resolve(example.value)})
    ).resolves.toMatchObject({
      title: 'here'
    })
  })

  test('throws on wrong value type resolved', () => {
    expect(resolveInitialValue({...example, value: () => null})).rejects.toMatchObject({
      message: 'Template "author" initial value: resolved to a non-object'
    })
  })

  test('throws on values with sub-objects missing `_type`', () => {
    expect(
      resolveInitialValue({...example, value: {image: {_type: 'image', meta: {foo: 'foo'}}}})
    ).rejects.toMatchObject({
      message: 'Template "author" initial value: missing "_type" property at path "image.meta"'
    })
  })

  test('applies missing `_type` to references', () => {
    expect(
      resolveInitialValue({...example, value: {image: {_type: 'image', asset: {_ref: 'foo'}}}})
    ).resolves.toMatchObject({image: {_type: 'image', asset: {_ref: 'foo', _type: 'reference'}}})
  })

  test('applies missing `_key` to array object children', async () => {
    const result = await resolveInitialValue({
      ...example,
      value: {categories: [{_ref: 'php'}, {_ref: 'js'}]}
    })

    expect(result).toMatchObject({
      categories: [{_ref: 'php', _type: 'reference'}, {_ref: 'js', _type: 'reference'}]
    })

    expect(result.categories[0]).toHaveProperty('_key')
    expect(result.categories[1]).toHaveProperty('_key')
    expect(result.categories[0]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
    expect(result.categories[1]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
  })

  test('applies missing `_key` to array object children deeply', async () => {
    const result = await resolveInitialValue({
      ...example,
      value: {meta: [{_type: 'holder', categories: [{_ref: 'php'}, {_ref: 'js'}]}]}
    })

    expect(result).toMatchObject({
      meta: [
        {
          _type: 'holder',
          categories: [{_ref: 'php', _type: 'reference'}, {_ref: 'js', _type: 'reference'}]
        }
      ]
    })

    expect(result.meta[0].categories[0]).toHaveProperty('_key')
    expect(result.meta[0].categories[1]).toHaveProperty('_key')
    expect(result.meta[0].categories[0]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
    expect(result.meta[0].categories[1]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
  })
})

describe('getTemplates', () => {
  test('returns defaults if part is not implemented', () => {
    expect(getTemplates()).toMatchSnapshot()
  })

  test('returns defined templates if part implemented', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: {title: 'here'}
      },
      {
        serialize: () => ({
          id: 'developer',
          title: 'Developer',
          schemaType: 'developer',
          value: {title: 'Foo'}
        })
      }
    ])
    expect(getTemplates()).toMatchSnapshot()
  })

  test('validates that templates has ID', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        title: 'Author',
        schemaType: 'author',
        value: {title: 'here'}
      }
    ])

    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })

  test('validates that templates has title', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        schemaType: 'author',
        value: {title: 'here'}
      }
    ])

    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })

  test('validates that templates has schema type', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        value: {title: 'here'}
      }
    ])

    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })

  test('validates that templates has value', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author'
      }
    ])

    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })

  test('validates that templates has id, title, schemaType, value', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [{}])
    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })

  test('validates that templates has an object/function value', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: []
      }
    ])

    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })

  test('validates that templates has unique IDs', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: {name: 'Gunnar'}
      },
      {
        id: 'author',
        title: 'Developer',
        schemaType: 'author',
        value: {role: 'developer'}
      }
    ])

    expect(() => getTemplates()).toThrowErrorMatchingSnapshot()
  })
})
