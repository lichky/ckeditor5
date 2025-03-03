---
# Scope:
# * Explain what content styles are and how to use them.
# * Offer developers a way to obtain the editor content styles.

category: builds-integration
order: 80
---

# Content styles

Some of the {@link features/index core editor features} bring additional CSS to control the look of the content they produce. Take, for example, the {@link features/image image feature} that needs special content styles to render images and their captions in the content. Or the {@link module:block-quote/blockquote~BlockQuote block quote} feature that displays quotes in italic with a subtle border on the side.

{@img assets/img/builds-content-styles.png 823 Editor content styles.}

Content styles are bundled along with editor UI styles and, together with the JavaScript code of CKEditor 5, they create a monolithic structure called an {@link builds/guides/overview#available-builds editor build}. By default, content styles are inseparable from the rest of the editor which means there is no CSS file containing them you could take straight from the editor and use in your application (as opposed to the CKEditor 4 `contents.css` file). To get the editor content styles, for instance, for the front–end of your application, you will have to take additional steps described in this guide.

## Sharing content styles between front–end and back–end

By default, content styles are loaded by the editor JavaScript which makes them only present when users edit their content and this, in turn, usually takes place in the back–end of an application. If you want to use the same styles in the front–end, you may find yourself in a situation that requires you to load CKEditor just for that purpose, which is (performance–wise) not the best idea.

To avoid unnecessary dependencies in your front–end, use a stylesheet with a complete list of CKEditor 5 content styles used by all editor features. There are two ways to obtain it:

* By taking it directly from [this guide](#the-full-list-of-content-styles) and saving it as a static resource in your application (e.g. `content-styles.css`) (**recommended**).
* By generating it using a dedicated script. Learn more in the {@link framework/guides/contributing/development-environment#generating-content-styles Development environment} guide.

Load the `content-styles.css` file in your application by adding the following code to the template:

```html
<link rel="stylesheet" href="path/to/assets/content-styles.css" type="text/css">
```

The content in the front–end of your application should now look the same as when edited by the users.

<info-box warning>
	**Important!**

	If you take a closer look at the content styles, you may notice they are prefixed with the `.ck-content` class selector. This narrows their scope when used in CKEditor 5 so they do not affect the rest of the application. To use them in the front–end, **you will have to** add the `ck-content` CSS class to the container of your content. Otherwise the styles will not be applied.
</info-box>

<info-box>
	If you are not afraid to get your hands dirty, you can always create a custom CKEditor 5 build from the source code with **all** the CSS (both UI and the content) extracted to a separate file. See how to do that in a {@link builds/guides/integration/advanced-setup#option-extracting-css dedicated guide}.
</info-box>

## The full list of content styles

Below there is a full list of content styles used by the editor features. You can copy it and use straight in your project. **Make sure to add the `ck-content` class to your content container for the styles to work** ([see above](#sharing-content-styles-between-frontend-and-backend)).

```css
/*
 * CKEditor 5 (v15.0.0) content styles.
 * Generated on Tue, 29 Oct 2019 08:39:09 GMT.
 * For more information, check out https://ckeditor.com/docs/ckeditor5/latest/builds/guides/integration/content-styles.html
 */

:root {
	--ck-highlight-marker-blue: #72cdfd;
	--ck-highlight-marker-green: #63f963;
	--ck-highlight-marker-pink: #fc7999;
	--ck-highlight-marker-yellow: #fdfd77;
	--ck-highlight-pen-green: #118800;
	--ck-highlight-pen-red: #e91313;
	--ck-image-style-spacing: 1.5em;
	--ck-todo-list-checkmark-size: 16px;
}

/* ckeditor5-basic-styles/theme/code.css */
.ck-content code {
	background-color: hsla(0, 0%, 78%, 0.3);
	padding: .15em;
	border-radius: 2px;
}
/* ckeditor5-image/theme/imagecaption.css */
.ck-content .image > figcaption {
	display: table-caption;
	caption-side: bottom;
	word-break: break-word;
	color: hsl(0, 0%, 20%);
	background-color: hsl(0, 0%, 97%);
	padding: .6em;
	font-size: .75em;
	outline-offset: -1px;
}
/* ckeditor5-image/theme/imageresize.css */
.ck-content .image.image_resized {
	max-width: 100%;
	display: block;
	box-sizing: border-box;
}
/* ckeditor5-image/theme/imageresize.css */
.ck-content .image.image_resized img {
	width: 100%;
}
/* ckeditor5-image/theme/imageresize.css */
.ck-content .image.image_resized > figcaption {
	display: block;
}
/* ckeditor5-image/theme/image.css */
.ck-content .image {
	display: table;
	clear: both;
	text-align: center;
	margin: 1em auto;
}
/* ckeditor5-image/theme/image.css */
.ck-content .image > img {
	display: block;
	margin: 0 auto;
	max-width: 100%;
	min-width: 50px;
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list {
	list-style: none;
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list li {
	margin-bottom: 5px;
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list li .todo-list {
	margin-top: 5px;
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list .todo-list__label > input {
	-webkit-appearance: none;
	display: inline-block;
	position: relative;
	width: var(--ck-todo-list-checkmark-size);
	height: var(--ck-todo-list-checkmark-size);
	vertical-align: middle;
	border: 0;
	left: -25px;
	margin-right: -15px;
	right: 0;
	margin-left: 0;
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list .todo-list__label > input::before {
	display: block;
	position: absolute;
	box-sizing: border-box;
	content: '';
	width: 100%;
	height: 100%;
	border: 1px solid hsl(0, 0%, 20%);
	border-radius: 2px;
	transition: 250ms ease-in-out box-shadow, 250ms ease-in-out background, 250ms ease-in-out border;
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list .todo-list__label > input::after {
	display: block;
	position: absolute;
	box-sizing: content-box;
	pointer-events: none;
	content: '';
	left: calc( var(--ck-todo-list-checkmark-size) / 3 );
	top: calc( var(--ck-todo-list-checkmark-size) / 5.3 );
	width: calc( var(--ck-todo-list-checkmark-size) / 5.3 );
	height: calc( var(--ck-todo-list-checkmark-size) / 2.6 );
	border-style: solid;
	border-color: transparent;
	border-width: 0 calc( var(--ck-todo-list-checkmark-size) / 8 ) calc( var(--ck-todo-list-checkmark-size) / 8 ) 0;
	transform: rotate(45deg);
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list .todo-list__label > input[checked]::before {
	background: hsl(126, 64%, 41%);
	border-color: hsl(126, 64%, 41%);
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list .todo-list__label > input[checked]::after {
	border-color: hsl(0, 0%, 100%);
}
/* ckeditor5-list/theme/todolist.css */
.ck-content .todo-list .todo-list__label .todo-list__label__description {
	vertical-align: middle;
}
/* ckeditor5-media-embed/theme/mediaembed.css */
.ck-content .media {
	clear: both;
	margin: 1em 0;
	display: block;
	min-width: 15em;
}
/* ckeditor5-image/theme/imagestyle.css */
.ck-content .image-style-side,
.ck-content .image-style-align-left,
.ck-content .image-style-align-center,
.ck-content .image-style-align-right {
	max-width: 50%;
}
/* ckeditor5-image/theme/imagestyle.css */
.ck-content .image-style-side {
	float: right;
	margin-left: var(--ck-image-style-spacing);
}
/* ckeditor5-image/theme/imagestyle.css */
.ck-content .image-style-align-left {
	float: left;
	margin-right: var(--ck-image-style-spacing);
}
/* ckeditor5-image/theme/imagestyle.css */
.ck-content .image-style-align-center {
	margin-left: auto;
	margin-right: auto;
}
/* ckeditor5-image/theme/imagestyle.css */
.ck-content .image-style-align-right {
	float: right;
	margin-left: var(--ck-image-style-spacing);
}
/* ckeditor5-page-break/theme/pagebreak.css */
.ck-content .page-break {
	position: relative;
	clear: both;
	padding: 5px 0;
	display: flex;
	align-items: center;
	justify-content: center;
}
/* ckeditor5-page-break/theme/pagebreak.css */
.ck-content .page-break::after {
	content: '';
	position: absolute;
	border-bottom: 2px dashed hsl(0, 0%, 77%);
	width: 100%;
}
/* ckeditor5-page-break/theme/pagebreak.css */
.ck-content .page-break__label {
	position: relative;
	z-index: 1;
	padding: .3em .6em;
	display: block;
	text-transform: uppercase;
	border: 1px solid hsl(0, 0%, 77%);
	border-radius: 2px;
	font-family: Helvetica, Arial, Tahoma, Verdana, Sans-Serif;
	font-size: 0.75em;
	font-weight: bold;
	color: hsl(0, 0%, 20%);
	background: #fff;
	box-shadow: 2px 2px 1px hsla(0, 0%, 0%, 0.15);
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
}
/* ckeditor5-block-quote/theme/blockquote.css */
.ck-content blockquote {
	overflow: hidden;
	padding-right: 1.5em;
	padding-left: 1.5em;
	margin-left: 0;
	margin-right: 0;
	font-style: italic;
	border-left: solid 5px hsl(0, 0%, 80%);
}
/* ckeditor5-block-quote/theme/blockquote.css */
.ck-content[dir="rtl"] blockquote {
	border-left: 0;
	border-right: solid 5px hsl(0, 0%, 80%);
}
/* ckeditor5-horizontal-line/theme/horizontalline.css */
.ck-content hr {
	border-width: 1px 0 0;
	border-style: solid;
	border-color: hsl(0, 0%, 37%);
	margin: 0;
}
/* ckeditor5-table/theme/table.css */
.ck-content .table {
	margin: 1em auto;
	display: table;
}
/* ckeditor5-table/theme/table.css */
.ck-content .table table {
	border-collapse: collapse;
	border-spacing: 0;
	border: 1px double hsl(0, 0%, 70%);
}
/* ckeditor5-table/theme/table.css */
.ck-content .table table td,
.ck-content .table table th {
	min-width: 2em;
	padding: .4em;
	border-color: hsl(0, 0%, 85%);
}
/* ckeditor5-table/theme/table.css */
.ck-content .table table th {
	font-weight: bold;
	background: hsl(0, 0%, 98%);
}
/* ckeditor5-highlight/theme/highlight.css */
.ck-content .marker-yellow {
	background-color: var(--ck-highlight-marker-yellow);
}
/* ckeditor5-highlight/theme/highlight.css */
.ck-content .marker-green {
	background-color: var(--ck-highlight-marker-green);
}
/* ckeditor5-highlight/theme/highlight.css */
.ck-content .marker-pink {
	background-color: var(--ck-highlight-marker-pink);
}
/* ckeditor5-highlight/theme/highlight.css */
.ck-content .marker-blue {
	background-color: var(--ck-highlight-marker-blue);
}
/* ckeditor5-highlight/theme/highlight.css */
.ck-content .pen-red {
	color: var(--ck-highlight-pen-red);
	background-color: transparent;
}
/* ckeditor5-highlight/theme/highlight.css */
.ck-content .pen-green {
	color: var(--ck-highlight-pen-green);
	background-color: transparent;
}
@media print {
	/* ckeditor5-page-break/theme/pagebreak.css */
	.ck-content .page-break {
		padding: 0;
	}
	/* ckeditor5-page-break/theme/pagebreak.css */
	.ck-content .page-break::after {
		display: none;
	}
}
```
