![](https://badgen.net/badge/CodeX%20Editor/v2.0/blue)

# Simple Image Tool

Provides Image Blocks for the [CodeX Editor](https://ifmo.su/editor).

Works only with pasted image URLs and requires no server-side uploader.

![](assets/image-uploading.gif)

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev codex.editor.simple-image
```

Include module at your application

```javascript
const SimpleImage = require('codex.editor.simple-image');
```

### Download to your project's source dir

1. Upload folder `dist` from repository
2. Add `dist/bundle.js` file to your page.

### Load from CDN

Get newest bundle path from [RawGit](https://rawgit.com) — open site and paste link to JS bundle in repository.

`https://github.com/codex-editor/simple-image/blob/master/dist/bundle.js`

> Note: use `production` link with commit hash to avoid issues with caching.

Then require this script on page with CodeX Editor.

```html
<script src="..."></script>
```

## Usage

Add a new Tool to the `tools` property of the CodeX Editor initial config.

```javascript
var editor = CodexEditor({
  ...
  
  tools: {
    ...
    image: SimpleImage,
  }
  
  ...
});
```

## Config Params

This Tool has no config params

## Tool's settings

![](https://capella.pics/c74cdeec-3405-48ac-a960-f784188cf9b4.jpg)

1. Add border

2. Stretch to full-width

3. Add background and reduce image's max-width to 60%

## Output data

| Field          | Type      | Description                                                |
| -------------- | --------- | ---------------------------------------------------------- |
| url            | `string`  | image's url                                                |
| caption        | `string`  | image's caption                                            |
| withBorder     | `boolean` | add border to image                                        |
| withBackground | `boolean` | need to reduce image's max-width to 60% and add background |
| stretched      | `boolean` | stretch image to screen's width                            |


```json
{
    "type" : "image",
    "data" : {
        "url" : "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg",
        "caption" : "Roadster // tesla.com",
        "withBorder" : false,
        "withBackground" : false,
        "stretched" : true
    }
}
```
