import Divider from '@material-ui/core/Divider'
import List from '@material-ui/core/List/List'
import ListItem from '@material-ui/core/ListItem'
import React from 'react'
import { changeCurrentAttributes, changeLabelProps } from '../action/common'
import { renderButtons, renderTemplate } from '../common/label'
import Session from '../common/session'
import { Attribute } from '../functional/types'
import { Component } from './component'
import { genButton } from './general_button'
import { Category } from './toolbar_category'

/** This is the interface of props passed to ToolBar */
interface Props {
  /** categories of ToolBar */
  categories: string[] | null
  /** attributes of ToolBar */
  attributes: Attribute[]
  /** itemType of ToolBar 'video' | 'image' */
  itemType: string
  /** labelType of ToolBar 'box2d' | 'segmentation' | 'lane' */
  labelType: string
}
/**
 * This is ToolBar component that displays
 * all the attributes and categories for the 2D bounding box labeling tool
 */
export class ToolBar extends Component<Props> {
  constructor (props: Readonly<Props>) {
    super(props)
    this.handleToggle = this.handleToggle.bind(this)
  }
  /**
   * ToolBar render function
   * @return component
   */
  public render () {
    const { categories, attributes, itemType, labelType } = this.props
    // FIXME: multiple option support
    const currentAttributes = Session.getState().current.attributes
    return (
      <div>
        <ListItem style={{ textAlign: 'center' }} >
          <Category categories={categories} headerText={'Label Category'}/>
        </ListItem>
        <Divider variant='middle' />
        <List>
          {attributes.map((element: Attribute, index: number) => (
            renderTemplate(element.toolType, this.handleToggle,
              element.name, element.values,
              Object.keys(currentAttributes).indexOf(String(index)) >= 0 ?
              currentAttributes[index][0]
              : 0)
          ))}
        </List>
        <div>
          <div>
            {genButton({ name: 'Remove' })}
          </div>
          {renderButtons(itemType, labelType)}
        </div>
      </div>
    )
  }
  /**
   * This function updates the checked list of switch buttons.
   * @param {string} switchName
   */
  private readonly handleToggle = (switchName: string) => () => {
    const state = Session.getState()
    const allAttributes = state.config.attributes
    let toggleIndex = -1
    for (let i = 0; i < allAttributes.length; i++) {
      if (allAttributes[i].name === switchName) {
        toggleIndex = i
      }
    }
    if (toggleIndex > -1) {
      const currentAttributes = state.items[state.current.item].labels[
        state.current.label].attributes
      const attributes: {[key: number]: number[]} = {}
      for (const keyStr of Object.keys(currentAttributes)) {
        const key = Number(keyStr)
        attributes[key] = currentAttributes[key]
      }
      if (Object.keys(attributes).indexOf(String(toggleIndex)) >= 0) {
        delete attributes[toggleIndex]
      } else {
        attributes[toggleIndex] = [1]
      }
      Session.dispatch(changeLabelProps(state.current.item, state.current.label,
        { attributes }))
      Session.dispatch(changeCurrentAttributes(attributes))
    }
  }
}
