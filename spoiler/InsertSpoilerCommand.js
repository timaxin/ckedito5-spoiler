// spoiler/InsertSpoilerCommand.js

import Command from '@ckeditor/ckeditor5-core/src/command';

export default class InsertSpoilerCommand extends Command {
  execute() {
    this.editor.model.change( writer => {
      // Insert <spoiler>*</spoiler> at the current selection position
      // in a way that will result in creating a valid model structure.
      this.editor.model.insertContent( createSpoiler( writer ) );
    } );
  }

  refresh() {
    const model = this.editor.model;
    const selection = model.document.selection;
    const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'spoiler' );

    this.isEnabled = allowedIn !== null;
  }
}

function createSpoiler( writer ) {
  const spoiler = writer.createElement( 'spoiler' );
  const spoilerTitle = writer.createElement( 'spoilerTitle' );
  const spoilerContent = writer.createElement( 'spoilerContent' );

  writer.append( spoilerTitle, spoiler );
  writer.append( spoilerContent, spoiler );

  // There must be at least one paragraph for the description to be editable.
  // See https://github.com/ckeditor/ckeditor5/issues/1464.
  writer.appendElement( 'paragraph', spoilerContent );

  return spoiler;
}
