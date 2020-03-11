import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import InsertSpoilerCommand from './InsertSpoilerCommand';

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
    const command = editor.commands.get( 'insertSpoiler' );

    // Overwrite default Enter key behavior.
    // If Enter key is pressed with selection collapsed in empty block inside a quote, break the quote.
    // This listener is added in afterInit in order to register it after list's feature listener.
    // We can't use a priority for this, because 'low' is already used by the enter feature, unless
    // we'd use numeric priority in this case.
    this.listenTo( this.editor.editing.view.document, 'enter', ( evt, data ) => {
      const doc = this.editor.model.document;
      const positionParent = doc.selection.getLastPosition().parent;

      if ( doc.selection.isCollapsed && positionParent.isEmpty ) {
        this.editor.execute( 'blockQuote' );
        this.editor.editing.view.scrollToTheSelection();

        data.preventDefault();
        evt.stop();
      }
    } );
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register( 'spoiler', {
      isObject: true,
      allowWhere: '$block'
    } );

    schema.register( 'spoilerTitle', {
      allowIn: 'spoiler',
      allowContentOf: '$block'
    } )

    schema.register( 'spoilerContent', {
      allowIn: 'spoiler',
      allowContentOf: '$block'
    } )

    schema.addChildCheck( ( context, childDefinition ) => {
      if ( context.endsWith( 'spoilerContent' ) && childDefinition.name === 'spoiler' ) {
        return false;
      }
    } );
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

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

        return toWidgetEditable( div, viewWriter );
      }
    } );
  }
}
