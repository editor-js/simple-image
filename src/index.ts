/**
 * Build styles
 */
import "./index.css";

import {
  IconAddBorder,
  IconStretch,
  IconAddBackground,
} from "@codexteam/icons";
import { SimpleImageData, SimpleImageConfig } from "./types";
import {
  API,
  FilePasteEventDetail,
  PasteEvent,
  PatternPasteEventDetail,
  BlockTool,
} from "@editorjs/editorjs";
import type { TagPasteEventDetail } from "./types";

/**
 * SimpleImage Tool for the Editor.js
 * Works only with pasted image URLs and requires no server-side uploader.
 *
 * @typedef {object} SimpleImageData
 * @description Tool's input and output data format
 * @property {string} url — image URL
 * @property {string} caption — image caption
 * @property {boolean} withBorder - should image be rendered with border
 * @property {boolean} withBackground - should image be rendered with background
 * @property {boolean} stretched - should image be stretched to full width of container
 */

export default class SimpleImage implements BlockTool {
  /**
   * Editor.js API instance
   */
  private api: API;

  /**
   * Indicates whether the block is in read-only mode
   */
  private readOnly: boolean;

  /**
   * Index of the current block in the editor
   */
  private blockIndex: number;

  /**
   * CSS classes used for styling elements
   */
  private CSS: {
    baseClass: string;
    loading: string;
    input: string;
    wrapper: string;
    imageHolder: string;
    caption: string;
  };

  /**
   * Cache of DOM nodes used in the block
   */
  private nodes: {
    wrapper: HTMLElement | null;
    imageHolder: HTMLElement | null;
    image: HTMLImageElement | null;
    caption: HTMLElement | null;
  };

  /**
   * Tool's data storage
   */
  private _data!: SimpleImageData;

  /**
   * Available image settings (tunes) config
   */
  private tunes: Array<{
    name: keyof SimpleImageData;
    label: string;
    icon: string;
  }>;

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: SimpleImageData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   *   readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }: SimpleImageConfig) {
    /**
     * Editor.js API
     */
    this.api = api;
    this.readOnly = readOnly;

    /**
     * When block is only constructing,
     * current block points to previous block.
     * So real block index will be +1 after rendering
     *
     * @todo place it at the `rendered` event hook to get real block index without +1;
     * @type {number}
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
      wrapper: "cdx-simple-image",
      imageHolder: "cdx-simple-image__picture",
      caption: "cdx-simple-image__caption",
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
      url: data?.url || "",
      caption: data?.caption || "",
      withBorder: data?.withBorder ?? false,
      withBackground: data?.withBackground ?? false,
      stretched: data?.stretched ?? false,
    };

    /**
     * Available Image tunes
     */
    this.tunes = [
      {
        name: "withBorder",
        label: "Add Border",
        icon: IconAddBorder,
      },
      {
        name: "stretched",
        label: "Stretch Image",
        icon: IconStretch,
      },
      {
        name: "withBackground",
        label: "Add Background",
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
  render(): HTMLElement {
    const wrapper = this._make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      loader = this._make("div", this.CSS.loading),
      imageHolder = this._make("div", this.CSS.imageHolder),
      image = this._make("img", null) as HTMLImageElement,
      caption = this._make("div", [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
        innerHTML: this.data.caption || "",
      });

    caption.dataset.placeholder = "Enter a caption";

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
      console.log("Failed to load an image", e);
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
  save(blockContent: HTMLElement): SimpleImageData {
    const image = blockContent.querySelector("img"),
      caption = blockContent.querySelector("." + this.CSS.input);

    if (!image) {
      return this.data;
    }

    return Object.assign(this.data, {
      url: image?.src || "",
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
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Handles file drop events by converting the image to base64
   *
   * @param {File} file - The dropped file object
   * @returns {Promise<SimpleImageData>} Promise resolving to image data
   */
  onDropHandler(file: File): Promise<SimpleImageData> {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    return new Promise((resolve) => {
      reader.onload = (event) => {
        resolve({
          url: event?.target?.result as string,
          caption: file.name,
          withBorder: false,
          withBackground: false,
          stretched: false,
        });
      };
    });
  }

  /**
   * Handles paste events for images
   * Supports pasting image tags, URLs, and files
   *
   * @param {PasteEvent} event - The paste event containing image data
   */
  onPaste(event: PasteEvent) {
    switch (event.type) {
      case "tag": {
        const img = (event.detail as TagPasteEventDetail)
          .data as HTMLImageElement;
        this.data = {
          url: img?.src || "",
          caption: "",
          withBorder: false,
          withBackground: false,
          stretched: false,
        };
        break;
      }

      case "pattern": {
        const detail = event.detail as unknown as PatternPasteEventDetail;
        this.data = {
          url: detail.data,
          caption: "",
          withBorder: false,
          withBackground: false,
          stretched: false,
        };
        break;
      }

      case "file": {
        const detail = event.detail as FilePasteEventDetail;
        this.onDropHandler(detail.file).then((data) => {
          this.data = data;
        });
        break;
      }
    }
  }

  /**
   * Getter for the tool's data
   *
   * @returns {SimpleImageData} Current image block data
   */
  get data(): SimpleImageData {
    return this._data;
  }

  /**
   * Setter for the tool's data
   * Updates both the data storage and the view
   *
   * @param {SimpleImageData} data - New image block data
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
        mimeTypes: ["image/*"],
      },
    };
  }

  /**
   * Returns image tunes config
   *
   * @returns {Array}
   */
  renderSettings(): Array<{
    name: keyof SimpleImageData;
    label: string;
    icon: string;
    toggle: boolean;
    onActivate: () => void;
    isActive: boolean;
  }> {
    return this.tunes.map((tune) => ({
      ...tune,
      label: this.api.i18n.t(tune.label),
      toggle: true,
      onActivate: () =>
        this._toggleTune(
          tune.name as "withBorder" | "withBackground" | "stretched"
        ),
      isActive: !!this.data[tune.name],
    }));
  }

  /**
   * Creates a DOM element with specified attributes and classes
   *
   * @private
   * @param {string} tagName - The HTML tag name for the new element
   * @param {Array<string>|string|null} classNames - CSS class name(s) to add to the element
   * @param {Record<string, any>} attributes - Object containing element attributes
   * @returns {HTMLElement} The created DOM element
   */
  _make(
    tagName: string,
    classNames: Array<string> | string | null,
    attributes: Record<string, any> = {}
  ): HTMLElement {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      if (attrName === "contentEditable") {
        el.contentEditable = attributes[attrName];
      } else if (attrName === "innerHTML") {
        el.innerHTML = attributes[attrName];
      } else {
        el.setAttribute(attrName, attributes[attrName]);
      }
    }

    return el;
  }

  /**
   * Toggles the specified tune (image setting) on/off
   *
   * @private
   * @param {('withBorder'|'withBackground'|'stretched')} tune - The tune property to toggle
   */
  _toggleTune(tune: "withBorder" | "withBackground" | "stretched") {
    if (typeof this.data[tune] === "boolean") {
      this.data[tune] = !this.data[tune];
      this._acceptTuneView();
    }
  }

  /**
   * Updates the image holder's CSS classes based on active tunes
   * Applies visual modifications like border, background, and stretch settings
   *
   * @private
   */
  _acceptTuneView() {
    if (!this.nodes.imageHolder) return;

    this.tunes.forEach((tune) => {
      this.nodes.imageHolder?.classList.toggle(
        this.CSS.imageHolder +
          "--" +
          tune.name.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`),
        !!this.data[tune.name]
      );

      if (tune.name === "stretched") {
        this.api.blocks.stretchBlock(this.blockIndex, !!this.data.stretched);
      }
    });
  }
}
