import WebComponent from './mixins/component';

export default class SelectionToolbar extends WebComponent {
  static template = `<button data-type="bold"><b>b</b></button><button data-type="italic"><i>i</i></button><button data-type="strikethrough"><del>s</del></button>`;

  static style = `
    :host {
      border-radius: 4px;
    }
  `;

  static events = {
    click: 'onClick'
  };

  onClick(evt: MouseEvent) {
    let target = null;
    for (let i of evt.path.length) {
      if (evt.path[i].nodeName === 'BUTTON') {
        target = evt.path[i];
        break;
      }
    }

    let type = target.getAttribute('data-type');
    let start = this.getAttribute('start');
    let end = this.getAttribute('end');

    if (start === null || end === null) return;

    let detail = {
      type,
      start: parseInt(start, 10),
      end: parseInt(end, 10),
      attributes: {}
    };

    if (type === 'link') {
      detail.attributes = { url: '' };
    }

    this.dispatchEvent(new CustomEvent('addAnnotation', { bubbles: true, detail }));
  }
}

if (!window.customElements.get('selection-toolbar')) {
  window.customElements.define('selection-toolbar', SelectionToolbar);
}
