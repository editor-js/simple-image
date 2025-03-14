import type { API } from "@editorjs/editorjs";

/**
 * Interface representing the data structure for a simple image block
 * @interface SimpleImageData
 */
export interface SimpleImageData {
  /** URL or source of the image */
  url: string;
  /** Optional text description displayed below the image */
  caption: string;
  /** Whether the image has a border */
  withBorder: boolean;
  /** Whether the image has a background */
  withBackground: boolean;
  /** Whether the image is stretched to full width */
  stretched: boolean;
}

/**
 * Configuration options for the Simple Image block
 * @interface SimpleImageConfig
 */
export interface SimpleImageConfig {
  /** Image data (may be partial during initialization) */
  data?: Partial<SimpleImageData>;
  /** Additional configuration options */
  config?: any;
  /** Editor.js API instance */
  api: API;
  /** Whether the editor is in read-only mode */
  readOnly: boolean;
}

/**
 * Event detail for paste events containing HTML tags
 * @interface TagPasteEventDetail
 */
export interface TagPasteEventDetail {
  /** The HTML element data from the paste event */
  data: HTMLElement;
}
