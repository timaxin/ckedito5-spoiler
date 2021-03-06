import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import InsertSpoilerCommand from './InsertSpoilerCommand';
import { enablePlaceholder, disablePlaceholder } from '@ckeditor/ckeditor5-engine/src/view/placeholder';
import DocumentSelection from '@ckeditor/ckeditor5-engine/src/model/documentselection';

export default class SpoilerEditing extends Plugin {

  static get requires() {
    return [ Widget ];
  }

  static get pluginName() {
    return 'SpoilerEditing';
  }

  init() {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const t = editor.t;
    const view = editor.editing.view.document;

    this._defineSchema();
    this._defineConverters();

    this.listenTo(selection, 'change:range', (evt) => {
      const doc = this.editor.model.document;
      const selectedElement = doc.selection.getSelectedElement();
      if (selectedElement && selectedElement.name === 'spoiler') {
        model.change(writer => {
          writer.setSelection(selectedElement._children._nodes[1], 0);
        })
      }
    })

    this.listenTo(view, 'enter', (evt, data) => {
      const doc = this.editor.model.document;
      const positionParent = doc.selection.getLastPosition().parent;

      if ( positionParent.name == 'spoilerTitle' ) {
        if (data.isSoft) {
          model.change(writer => {
            const paragraph = writer.createElement( 'paragraph' );
            let positionBefore = writer.createPositionBefore( positionParent.parent );
            writer.insert( paragraph, positionBefore );
            this._collapseSelectionAt( writer, doc.selection, writer.createPositionAt( paragraph, 0 ) );
          })
        } else {
          model.change(writer => {
            writer.setSelection(positionParent.parent._children._nodes[1], 0);
          });
        }
        data.preventDefault();
        evt.stop();
      }

      if (positionParent.parent.name === 'spoilerContent' && this.placeholderEnabled) {
        disablePlaceholder(this.editor.editing.view, this.element)
        this.placeholderEnabled = false
      }

      if (doc.selection.isCollapsed && positionParent.name === 'paragraph' && positionParent.isEmpty && positionParent.parent.name === 'spoilerContent' && !data.isSoft && !positionParent.nextSibling) {
        model.change(writer => {
          const paragraph = writer.createElement( 'paragraph' );
          let positionAfter = writer.createPositionAfter( positionParent.parent.parent );
          writer.insert( paragraph, positionAfter );
          this._collapseSelectionAt( writer, doc.selection, writer.createPositionAt( paragraph, 0 ) );
          writer.remove(positionParent);
          setTimeout(() => {
            this.editor.editing.view.scrollToTheSelection();
          }, 0)
        })
        data.preventDefault();
        evt.stop();
      }
    });

    editor.commands.add( 'insertSpoiler', new InsertSpoilerCommand( this.editor ) )
  }

  afterInit() {
    const editor = this.editor;
    const model = editor.model;
    const view = editor.editing.view.document;
    const editingView = editor.editing.view;

    this.listenTo(view, 'delete', (evt, data) => {
      const doc = editor.model.document;
      const positionParent = doc.selection.getLastPosition().parent;

      if (positionParent && positionParent.name === 'spoilerTitle') {
        const spoiler = positionParent.parent;
        if (spoiler._children._nodes.every(node => node.isEmpty || node._children._nodes.every(subNode => subNode.isEmpty))) {
          model.change(writer => {
            writer.remove(spoiler)
          })
        }
      }
      if (positionParent && positionParent.parent && positionParent.parent.name === 'spoilerContent' && positionParent.parent._children.length === 1) {
        enablePlaceholder({
          view: editingView,
          element: this.element,
          text: 'Содержание спойлера'
        })
        this.placeholderEnabled = true
      }
    }, {priority: 'high'})
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register( 'spoiler', {
      isObject: true,
      allowWhere: '$block'
    } );

    schema.register( 'spoilerTitle', {
      isLimit: true,
      allowIn: 'spoiler',
      allowContentOf: '$block'
    } )

    schema.register( 'spoilerContent', {
      allowIn: 'spoiler',
      allowContentOf: '$root'
    } )

    schema.addChildCheck( ( context, childDefinition ) => {
      if ( context.endsWith( 'spoilerContent' ) && ['spoiler', 'blockQuote'].includes(childDefinition.name)) {
        return false;
      }
    } );
  }

  _defineConverters() {
    const conversion = this.editor.conversion;
    const view = this.editor.editing.view;

    // <spoiler> converters
    conversion.for( 'upcast' ).elementToElement( {
      model: 'spoiler',
      view: {
        name: 'div',
        classes: 'spoiler'
      }
    } );
    conversion.for( 'dataDowncast' ).elementToElement( {
      model: 'spoiler',
      view: {
        name: 'div',
        classes: 'spoiler'
      }
    } );
    conversion.for( 'editingDowncast' ).elementToElement( {
      model: 'spoiler',
      view: ( modelElement, viewWriter ) => {
        const div = viewWriter.createContainerElement( 'div', { class: 'spoiler' } );

        return toWidget( div, viewWriter, { label: 'Спойлер' } );
      }
    } );

    // <spoilerTitle> converters
    conversion.for( 'upcast' ).elementToElement( {
      model: 'spoilerTitle',
      view: {
        name: 'h3',
        classes: 'spoiler-title'
      }
    } );
    conversion.for( 'dataDowncast' ).elementToElement( {
      model: 'spoilerTitle',
      view: {
        name: 'h3',
        classes: 'spoiler-title'
      }
    } );
    conversion.for( 'editingDowncast' ).elementToElement( {
      model: 'spoilerTitle',
      view: ( modelElement, viewWriter ) => {
        // Note: You use a more specialized createEditableElement() method here.
        const h3 = viewWriter.createEditableElement( 'h3', { class: 'spoiler-title' } );
        enablePlaceholder({
          view,
          element: h3,
          text: 'Заголовок спойлера'
        })

        return toWidgetEditable( h3, viewWriter );
      }
    } );

    // <spoilerContent> converters
    conversion.for( 'upcast' ).elementToElement( {
      model: ( viewElement, modelWriter ) => {
        return modelWriter.createElement( 'spoilerContent' );
      },
      view: {
        name: 'div',
        classes: 'spoiler-content'
      }
    } );
    conversion.for( 'dataDowncast' ).elementToElement( {
      model: 'spoilerContent',
      view: {
        name: 'div',
        classes: 'spoiler-content'
      }
    } );
    conversion.for( 'editingDowncast' ).elementToElement( {
      model: 'spoilerContent',
      view: ( modelElement, viewWriter ) => {
        // Note: You use a more specialized createEditableElement() method here.
        const div = viewWriter.createEditableElement( 'div', { class: 'spoiler-content' } );
        setTimeout(() => {
          this.element = div._children[0]
          enablePlaceholder({
            view,
            element: div._children[0],
            text: 'Содержание спойлера'
          })
          this.placeholderEnabled = false
        }, 0)

        return toWidgetEditable( div, viewWriter );
      }
    } );
  }

  _collapseSelectionAt( writer, selection, positionOrRange ) {
    if ( selection instanceof DocumentSelection ) {
      writer.setSelection( positionOrRange );
    } else {
      selection.setTo( positionOrRange );
    }
  }
}
