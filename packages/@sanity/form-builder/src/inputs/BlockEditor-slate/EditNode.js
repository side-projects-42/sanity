import React from 'react'
import {resolveTypeName} from '../../utils/resolveTypeName'
import {get} from 'lodash'
import {FormBuilderInput} from '../../FormBuilderInput'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Popover from 'part:@sanity/components/dialogs/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import styles from './styles/EditNode.css'

export default class EditNode extends React.Component {
  getMemberTypeOf(value) {
    const {type} = this.props
    const typeName = resolveTypeName(value)
    return type.of.find(memberType => memberType.name === typeName)
  }

  handleChange = patchEvent => {
    const {onChange, value} = this.props
    onChange(patchEvent.prefixAll(value._key))
  }

  handleClose = () => {
    const {onFocus, value} = this.props
    onFocus({_key: value._key})
  }

  render() {
    const {value, type, onFocus, focusPath} = this.props
    if (!value) {
      return <div>No value???</div>
    }
    const editModalLayout = get(type.options, 'editModal')
    const memberType = this.getMemberTypeOf(value)

    const input = (
      <div style={{minWidth: '30rem', padding: '1rem'}}>
        <FormBuilderInput
          type={memberType}
          level={1}
          value={value}
          onChange={this.handleChange}
          onFocus={onFocus}
          focusPath={focusPath}
          path={[{_key: value._key}]}
        />
      </div>
    )

    if (editModalLayout === 'fullscreen') {
      return (
        <FullscreenDialog isOpen title="Edit" onClose={this.handleClose}>
          {input}
        </FullscreenDialog>
      )
    }

    if (editModalLayout === 'fold') {
      return (
        <div className={styles.editBlockContainerFold}>
          <EditItemFold isOpen title="Edit" onClose={this.handleClose}>
            {input}
          </EditItemFold>
        </div>
      )
    }

    if (editModalLayout === 'popover') {
      return (
        <div className={styles.editBlockContainerPopOver}>
          <Popover title="@@todo" onClose={this.handleClose} onAction={this.handleDialogAction}>
            {input}
          </Popover>
        </div>
      )
    }
    return (
      <DefaultDialog
        isOpen
        title="Edit"
        onClose={this.handleClose}
        showCloseButton={false}
        onAction={this.handleDialogAction}
      >
        {input}
      </DefaultDialog>
    )
  }
}