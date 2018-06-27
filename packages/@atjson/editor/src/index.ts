import Document from '@atjson/document';
import WebComponentRenderer from './webcomponent-renderer';
import events from './mixins/events';
import './text-selection';
import './text-input';
import './selection-toolbar';

const TEXT_NODE_TYPE = 3;
type Range = { start: number, end: number };

type Element = TextNode | HTMLElement;

export default class Editor extends events(HTMLElement) {

  selection: Range;

  static template = '<text-input><text-selection><selection-toolbar slot="toolbar"></selection-toolbar><div class="editor" style="white-space: pre-wrap; padding: 1em; border: 1px solid black; border-radius: 5px; outline: none; font-size: 1.5em;" contenteditable></div></text-selection></text-input>';

  static events = {
    'change text-selection'(evt) {
      this.selection = evt.detail;
      let toolbar = this.querySelector('selection-toolbar');
      toolbar.setAttribute('start', evt.detail.start);
      toolbar.setAttribute('end', evt.detail.end);
    },

    'insertText text-input'(evt) {
      this.document.insertText(evt.detail.position, evt.detail.text);
      this.selection.start += evt.detail.text.length;
      this.selection.end += evt.detail.text.length;
    },

    'deleteText text-input'(evt) {
      let deletion = evt.detail;
      this.document.deleteText(deletion);
      // FIXME the selection should just be an annotation that we transform. We shouldn't handle logic here.
      if (this.selection.start < deletion.start) {
        // do nothing.
      } else if (this.selection.start < deletion.end) {
        this.selection.start = this.selection.end = deletion.start;
      } else {
        let l = deletion.end - deletion.start;
        this.selection.start -= l;
        this.selection.end -= l;
      }
    },

    'replaceText text-input'(evt) {
      let replacement = evt.detail;

      this.document.deleteText(replacement);
      this.document.insertText(replacement.start, replacement.text);
      this.selection.start = replacement.start + replacement.text.length;
    },

    'addAnnotation'(evt) {
      if (evt.detail.type === 'bold' || evt.detail.type === 'italic') {

        const contained = (a, b) => a.start >= b.start && a.end <= b.end
        const offset = (a, b) => a.start <= b.end && a.end >= b.start
        let overlapping = this.document.annotations.filter(a => a.type === evt.detail.type)
                                                   .filter(a => contained(a, evt.detail) || contained(evt.detail, a) || offset(a, evt.detail) || offset(evt.detail, a));

        let min = overlapping.reduce((a, b) => { return Math.min(a, b.start) }, this.document.content.length)
        let max = overlapping.reduce((a, b) => { return Math.max(a, b.end) }, 0)

        if (overlapping.length === 0) {
          this.document.addAnnotations(evt.detail);

        } else if (min <= evt.detail.start && evt.detail.end <= max && overlapping.length === 1) {
          // invert the state.
          let prev = overlapping[0];
          let newFirst = Object.assign({}, prev, evt.detail, { start: prev.start, end: evt.detail.start });
          let newLast = Object.assign({}, prev, evt.detail, { start: evt.detail.end, end: prev.end });
          if (min !== evt.detail.start) this.document.addAnnotations(newFirst)
          if (max !== evt.detail.end) this.document.addAnnotations(newLast);

        } else {
          this.document.addAnnotations(Object.assign({}, overlapping[0], evt.detail, { start: Math.min(min, evt.detail.start), end: Math.max(max, evt.detail.end) }));
        }

        overlapping.forEach(o => this.document.removeAnnotation(o));

      } else {
        this.document.addAnnotations(evt.detail);
      }
    }

    'attributechange text-input'(evt) {
      let annotationId = evt.target.getAttribute('data-annotation-id');
      let annotation = this.document.annotations.find(a => a.id.toString(10) === annotationId);
      this.document.replaceAnnotation(annotation, Object.assign(annotation, evt.detail));
    }

  };

  get value() {
    return this.document;
  }

  scheduleRender() {
    window.requestAnimationFrame(() => {
      this.render(this.querySelector('.editor'));
      let evt = new CustomEvent('change', { bubbles: true, detail: { document: this.document } });
      this.dispatchEvent(evt);
    });
  }

  render(editor) {
    let rendered = new WebComponentRenderer(this.document).render();

    // This can be improved by doing the comparison on an element-by-element
    // basis (or by rendering incrementally via the HIR), but for now this will
    // prevent flickering of OS UI elements (e.g., spell check) while typing
    // characters that don't result in changes outside of text elements.
    if (rendered.innerHTML != editor.innerHTML) {
      editor.innerHTML = rendered.innerHTML;

      if (this.selection) {
        this.querySelector('text-selection').setSelection(this.selection, { suppressEvents: true });
      }
    }
  }

  setDocument(value: Document) {
    this.document = value;

    // n.b., would be good to have a way to query for existence of id on
    // annotation (or to make ids required globally)
    this.document.where({}).map(a => {
      if (a.id !== undefined) return a;

      // this is not safe.
      let id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      return Object.assign(a, {id});
    });
    this.document.addEventListener('change', (_ => this.scheduleRender() ));
  }

  addContentFeature(component) {
    if (component.selectionButton) {
      this.querySelector('selection-toolbar').shadowRoot.appendChild(component.selectionButton);
    }

    if (component.annotationName) {
      WebComponentRenderer.prototype[component.annotationName] = component.elementRenderer;
    }
  }

  getSelection() {
    return this.querySelector('text-selection');
  }

  connectedCallback() {
    this.innerHTML = this.constructor.template;
    super.connectedCallback();
    this.render(this.querySelector('.editor'));
    this.render(this.querySelector('.output'));
  }

  constructor() {
    super();
    this.contentFeatures = [];
  }
}

if (!window.customElements.get('text-editor')) {
  window.customElements.define('text-editor', Editor);
}
