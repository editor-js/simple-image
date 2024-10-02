/**
 * Build styles
 */
import './index.css';

import { IconAddBorder, IconStretch, IconAddBackground } from '@codexteam/icons';

import type { API, FilePasteEvent, HTMLPasteEvent, PasteEvent, PatternPasteEvent } from "@editorjs/editorjs"

/**
 * SimpleImage Tool for the Editor.js
 * Works only with pasted image URLs and requires no server-side uploader.
 */

/**
 * Tool's input and output data format
 */
export interface SimpleImageData {
  /**
   * image URL
   */
  url: string;
  /**
   * image caption
   */
  caption: string;
  /**
   * should image be rendered with border
   */
  withBorder?: boolean;
  /**
   * should image be rendered with background
   */
  withBackground?: boolean;
  /**
   * should image be stretched to full width of container
   */
  stretched?: boolean;
}

/**
 * Represents the parameters used on the constructor inside the SimpleImage class
 */
interface SimpleImageParams {
  /**
   * previously saved data
   */
  data: SimpleImageData;
  /**
   * user config for Tool
   */
  config:object;
  /**
   * Editor.js API
   */
  api: API;
  /**
   * read-only mode flag
   */
  readOnly: boolean;
}

/**
 * Represents the styles and tools of a image
 */
interface SimpleImageCSS {
    /**
     * The base CSS class for the component, defining general styling for the entire element.
     */
    baseClass:string,
    /**
     * CSS class applied when the image or component is in a loading state.
     */
    loading: string,
    /**
     * CSS class applied to the input element.
     */
    input:string,
    /**
     * Tool's classes
     */
    wrapper: string,
    /**
     * Controlling the layout and appearance of the area where the image is displayed.
     */
    imageHolder: string,
    /**
     * Defining styles for the text or label associated with the image.
     */
    caption: string,
}

/**
 * Represents a single tune option for the tool
 */
interface Tune {
  /**
   * The name of the tune
   */
  name: string;
  /**
   * The label displayed
  */
 label: string;
 /**
  * The icon representing the tune, can be any type
  */
  icon: any;
}

/**
 * Represents the nodes (HTML elements) used in the tool
 */
interface Nodes {
  /**
   * The main wrapper element for the tool
   */
  wrapper: HTMLElement | null;
  /**
   * The container element for holding the image
   */
  imageHolder: HTMLElement | null;
  /**
   * The image element
   */
  image: HTMLImageElement | null;
  /**
   * The element used for displaying the image caption
   */
  caption: HTMLElement | null;
}

/**
 * Returns image tunes config
 */
interface TuneSetting {
  /**
   * Name of the tune setting
   */
  name: string;
  /**
   * Label of the tune setting
   */
  label: string;
  /**
   * Toogle tune
   */
  toggle: boolean;
  /**
   * Function that will run on activate
   */
  onActivate: () => void;
  /**
   * Property that will set if tune setting is active
   */
  isActive: boolean;
}

export default class SimpleImage {
  /**
   * Render plugin`s main Element and fill it with saved data
   */

  /**
   * Editor.js API instance
   */
  private api: API;
  /**
   * Flag indicating read-only mode
   */
  private readOnly: boolean;
  /**
   * The index of the current block in the editor
   */
  private blockIndex: number;
  /**
   * Stores current block data internally
   */
  private _data: SimpleImageData;
  /**
   * CSS classes used for styling the tool
   */
  private CSS: SimpleImageCSS;
  /**
   * Nodes cache
   */
  private nodes: Nodes;
  /**
   * Represents an array of tunes
   */
  private tunes: Tune[];
  

  constructor({ data, config, api, readOnly }: SimpleImageParams) {
    /**
     * Editor.js API 
     */
    this.api = api;
    /**
     * Read-only mode
     */
    this.readOnly = readOnly;

    /**
     * When block is only constructing,
     * current block points to previous block.
     * So real block index will be +1 after rendering
     *
     * @todo place it at the `rendered` event hook to get real block index without +1;
     */
    this.blockIndex = this.api.blocks.getCurrentBlockIndex() + 1;

    /**
     * Styles
     */
    this.CSS = {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      /**
       * Tool's classes
       */
      wrapper: 'cdx-simple-image',
      imageHolder: 'cdx-simple-image__picture',
      caption: 'cdx-simple-image__caption',
    };

    /**
     * Nodes cache
     */
    this.nodes = {
      wrapper: null,
      imageHolder: null,
      image: null,
      caption: null,
    };

    /**
     * Tool's initial data
     */
    this.data = {
      url: data.url || '',
      caption: data.caption || '',
      withBorder: data.withBorder !== undefined ? data.withBorder : false,
      withBackground: data.withBackground !== undefined ? data.withBackground : false,
      stretched: data.stretched !== undefined ? data.stretched : false,
    };

    /**
     * Available Image tunes
     */
    this.tunes = [
      {
        name: 'withBorder',
        label: 'Add Border',
        icon: IconAddBorder,
      },
      {
        name: 'stretched',
        label: 'Stretch Image',
        icon: IconStretch,
      },
      {
        name: 'withBackground',
        label: 'Add Background',
        icon: IconAddBackground,
      },
    ];
  }

  /**
   * Creates a Block:
   *  1) Show preloader
   *  2) Start to load an image
   *  3) After loading, append image and caption input
   *
   * @public
   */
  render() {
    /**
     * Specific return as on each of the _make
     */
    const wrapper = this._make('div',[this.CSS.baseClass, this.CSS.wrapper]) as HTMLElement,
        loader = this._make('div', this.CSS.loading) as HTMLElement,
        imageHolder = this._make('div', this.CSS.imageHolder) as HTMLElement,
        image = this._make('img') as HTMLImageElement,
        caption = this._make('div', [this.CSS.input, this.CSS.caption], {
          contentEditable: !this.readOnly,
          innerHTML: this.data.caption || '',
        }) as HTMLElement;

    caption.dataset.placeholder = 'Enter a caption';

    wrapper.appendChild(loader);

    if (this.data.url) {
      image.src = this.data.url;
    }

    image.onload = () => {
      wrapper.classList.remove(this.CSS.loading);
      imageHolder.appendChild(image);
      wrapper.appendChild(imageHolder);
      wrapper.appendChild(caption);
      loader.remove();
      this._acceptTuneView();
    };

    image.onerror = (e) => {
      // @todo use api.Notifies.show() to show error notification
      console.log('Failed to load an image', e);
    };

    this.nodes.imageHolder = imageHolder;
    this.nodes.wrapper = wrapper;
    this.nodes.image = image;
    this.nodes.caption = caption;

    return wrapper;
  }

  /**
   * @public
   * @param {Element} blockContent - Tool's wrapper
   * @returns {SimpleImageData}
   */
  save(blockContent: Element): SimpleImageData {
    const image = blockContent.querySelector('img'),
        caption = blockContent.querySelector('.' + this.CSS.input);

    if (!image) {
      return this.data;
    }

    return Object.assign(this.data, {
      url: image.src,
      caption: caption?.innerHTML || "",
    });
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      url: {},
      withBorder: {},
      withBackground: {},
      stretched: {},
      caption: {
        br: true,
      },
    };
  }

  /**
   * Notify core that read-only mode is suppoorted
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Read pasted image and convert it to base64
   *
   * @static
   * @param {File} file
   * @returns {Promise<SimpleImageData>}
   */
  onDropHandler(file: File): Promise<SimpleImageData> {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    return new Promise<SimpleImageData>((resolve) => {
      reader.onload = (event) => {
        const target = event.target as FileReader;
        if(typeof target.result === "string"){
          resolve({
            url: target.result,
            caption: file.name,
          });
        }
      }
    });
  }

  /**
   * On paste callback that is fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted config
   */
  onPaste(event: PasteEvent) {
    switch (event.type) {
      case 'tag': {
        const img = (event as HTMLPasteEvent).detail.data;
        if (img instanceof HTMLImageElement) {
          this.data = {
            url: img.src
          } as SimpleImageData;
        }
        break;
      }

      case 'pattern': {
        const { data: text } = (event as PatternPasteEvent).detail;

        this.data = {
          url: text
        } as SimpleImageData;
        break;
      }

      case 'file': {
        const { file } = (event as FilePasteEvent).detail;

        this.onDropHandler(file)
          .then(data => {
            this.data = data;
          });

        break;
      }
    }
  }

  /**
   * Returns image data
   *
   * @returns {SimpleImageData}
   */
  get data(): SimpleImageData {
    return this._data;
  }

  /**
   * Set image data and update the view
   *
   * @param {SimpleImageData} data
   */
  set data(data: SimpleImageData) {
    this._data = Object.assign({}, this.data, data);

    if (this.nodes.image) {
      this.nodes.image.src = this.data.url;
    }

    if (this.nodes.caption) {
      this.nodes.caption.innerHTML = this.data.caption;
    }
  }

  /**
   * Specify paste substitutes
   *
   * @see {@link ../../../docs/tools.md#paste-handling}
   * @public
   */
  static get pasteConfig() {
    return {
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|webp)$/i,
      },
      tags: [
        {
          img: { src: true },
        },
      ],
      files: {
        mimeTypes: [ 'image/*' ],
      },
    };
  }

  renderSettings(): Array<TuneSetting> {
    return this.tunes.map(tune => ({
      ...tune,
      label: this.api.i18n.t(tune.label),
      toggle: true,
      onActivate: () => this._toggleTune(tune.name),
      isActive: !!this.data[tune.name],
    }))
  };

  /**
   * Helper for making Elements with attributes
   *
   * @param  {string} tagName           - new Element tag name
   * @param  {Array|string} classNames  - list or name of CSS classname(s)
   * @param  {object} attributes        - any attributes
   * @returns {Element}
   */


  _make(tagName: string, classNames?: string[] | string, attributes: object = {}): HTMLElement | HTMLImageElement{
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      el[attrName] = attributes[attrName];
    }
    return el;
  }

  /**
   * Click on the Settings Button
   *
   * @private
   * @param tune
   */
  _toggleTune(tune:string) {
    this.data[tune] = !this.data[tune];
    this._acceptTuneView();
  }


  /**
   * Add specified class corresponds with activated tunes
   *
   * @private
   */
  _acceptTuneView() {
    this.tunes.forEach(tune => {
      if(this.nodes.imageHolder){
        this.nodes.imageHolder.classList.toggle(this.CSS.imageHolder + '--' + tune.name.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`), !!this.data[tune.name]);
      }
      if (tune.name === 'stretched') {
        this.api.blocks.stretchBlock(this.blockIndex, !!this.data.stretched);
      }
    });
  }
}
