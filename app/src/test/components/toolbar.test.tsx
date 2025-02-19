import { ListItemText } from '@material-ui/core'
import FormControlLabel from '@material-ui/core/FormControlLabel/FormControlLabel'
import { cleanup, fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { create } from 'react-test-renderer'
import { Category } from '../../js/components/toolbar_category'

afterEach(cleanup)

describe('Toolbar category setting', () => {
  test('Category selection', () => {
    const { getByLabelText } = render(
      <Category categories={['A', 'B']} headerText={'Label Category'} />)
    const selectedValued = getByLabelText(/A/i)
    expect(selectedValued.getAttribute('value')).toEqual('A')
    const radio = getByLabelText('A')
    fireEvent.change(radio, { target: { value: 'B' } })
    // expect state to be changed
    expect(radio.getAttribute('value')).toBe('B')
  })

  test('Test elements in Category', () => {
    const category = create(
      <Category categories={['A', 'B']} headerText={'Label Category'} />)
    const root = category.root
    expect(root.props.categories[0].toString()).toBe('A')
    expect(root.props.categories[1].toString()).toBe('B')
    expect(root.findByType(ListItemText).props.primary)
      .toBe('Label Category')
  })

  test('Category by type', () => {
    const category = create(
      <Category categories={['OnlyCategory']} headerText={'Label Category'} />)
    const root = category.root
    expect(root.findByType(FormControlLabel).props.label)
      .toBe('OnlyCategory')
  })

  test('Null category', () => {
    const category = create(
      <Category categories={null} headerText={'Label Category'} />)
    const root = category.getInstance()
    expect(root).toBe(null)
  })
})
