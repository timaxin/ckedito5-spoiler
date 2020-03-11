import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class SpoilerUI extends Plugin {

  static get pluginName() {
    return 'SpoilerUI';
  }

  init() {
    const editor = this.editor;

    const SpoilerIcon = editor.config.get('spoiler.icon');
    editor.ui.componentFactory.add( 'spoiler', locale => {
      const command = editor.commands.get( 'insertSpoiler' )

      const view = new ButtonView( locale );

      view.set( {
        label: 'Вставить спойлер',
        icon: SpoilerIcon,
        tooltip: true
      } );

      view.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

      this.listenTo( view, 'execute', () => editor.execute( 'insertSpoiler' ) )

      return view;
    } );
  }
}
