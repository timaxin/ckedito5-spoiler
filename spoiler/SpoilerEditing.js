import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import InsertSpoilerCommand from './InsertSpoilerCommand';
import { enablePlaceholder } from '@ckeditor/ckeditor5-engine/src/view/placeholder';

export default class SpoilerEditing extends Plugin {

  static get requires() {
    return [ Widget ];
  }

  static get pluginName() {
    return 'SpoilerEditing';
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    this._defineSchema();
    this._defineConverters();

    editor.commands.add( 'insertSpoiler', new InsertSpoilerCommand( this.editor ) )
  }

  afterInit() {
    const editor = this.editor;
    const schema = editor.model.schema;
    const command = editor.commands.get( 'insertSpoiler' );

    // Overwrite default Enter key behavior.
    // If Enter key is pressed with selection collapsed in empty block inside a quote, break the quote.
    // This listener is added in afterInit in order to register it after list's feature listener.
    // We can't use a priority for this, because 'low' is already used by the enter feature, unless
    // we'd use numeric priority in this case.
    editor.model.document.registerPostFixer( writer => {
      const changes = editor.model.document.differ.getChanges();

      for ( const entry of changes ) {
        if ( entry.type === 'remove' ) {
          if (entry.position.parent.name !== '$root') {
            const spoiler = entry.position.parent.name === 'spoilerTitle' ? entry.position.parent.parent : entry.position.parent.parent.parent;

            if (spoiler) {
              if (spoiler._children._nodes.some(elem => !(elem.isEmpty || (elem.name === 'spoilerContent' && elem._children._nodes.every(child => child.isEmpty))))) {
                return false
              }
              writer.remove(spoiler)
              return true
            }
          }
        }
      }

      return false;
    } );
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

    // <simpleBoxTitle> converters
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
      model: 'spoilerContent',
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
          enablePlaceholder({
            view,
            element: div._children[0],
            text: 'Содержание спойлера'
          })
        }, 0)

        return toWidgetEditable( div, viewWriter );
      }
    } );
  }
}
