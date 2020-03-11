import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import SpoilerEditing from './spoiler/SpoilerEditing';
import SpoilerUI from './spoiler/SpoilerUI';

export default class Image extends Plugin {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [ Widget, SpoilerEditing, SpoilerUI ];
  }

  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'Spoiler';
  }
}
