import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Value } from 'slate';
import { Editor } from 'slate-react';
import Html from 'slate-html-serializer'
import { makeStyles, Button, Icon, Toolbar } from '@material-ui/core';

const RichTextEditor = props => {

  const useStyles = makeStyles(theme => ({
    toolbar: {
      background: '#f2f2f2',
      justifyContent: 'flex-start',
      marginBottom: 10,
      paddingLeft: 12,
      paddingRight: 12,

      '& span': {
        fontSize: 22
      }
    },
    editor: {
      minHeight: 200
    },
    button: {
      padding: '10px 15px',
      opacity: '0.3',

      '&[active="true"]': {
        opacity: '1'
      }
    }
  }));
  const classes = useStyles();

  const BLOCK_TAGS = {
    p: 'paragraph',
    blockquote: 'block-quote',
    h3: 'heading',
    ul: 'bulleted-list',
    ol: 'numbered-list',
    li: 'list-item'
  };

  const MARK_TAGS = {
    em: 'italic',
    strong: 'bold',
    u: 'underlined'
  };

  const INLINE_TAGS = {
    a: 'link'
  };

  // Rules for serializing/deserializing
  const rules = [
    // Blocks
    {
      deserialize(el, next) {
        const type = BLOCK_TAGS[el.tagName.toLowerCase()];
        if (type) {
          return {
            object: 'block',
            type: type,
            data: {
              className: el.getAttribute('class'),
            },
            nodes: next(el.childNodes),
          }
        }
      },
      serialize(obj, children) {
        if (obj.object == 'block') {
          switch (obj.type) {
            case 'paragraph':
              return <p className={obj.data.get('className')}>{children}</p>;
            case 'block-quote':
              return <blockquote>{children}</blockquote>;
            case 'heading':
              return <h3>{children}</h3>;
            case 'bulleted-list':
              return <ul>{children}</ul>;
            case 'numbered-list':
              return <ol>{children}</ol>;
            case 'list-item':
              return <li>{children}</li>;
          }
        }
      },
    },
    // Marks
    {
      deserialize(el, next) {
        const type = MARK_TAGS[el.tagName.toLowerCase()];
        if (type) {
          return {
            object: 'mark',
            type: type,
            nodes: next(el.childNodes),
          };
        }
      },
      serialize(obj, children) {
        if (obj.object == 'mark') {
          switch (obj.type) {
            case 'bold':
              return <strong>{children}</strong>;
            case 'italic':
              return <em>{children}</em>;
            case 'underlined':
              return <u>{children}</u>;
          }
        }
      },
    },
    // Inlines
    {
      deserialize(el, next) {
        const type = INLINE_TAGS[el.tagName.toLowerCase()];
        if (type) {
          return {
            object: 'inline',
            type: type,
            data: {
              href: el.getAttribute('href'),
            },
            nodes: next(el.childNodes),
          };
        }
      },
      serialize(obj, children) {
        if (obj.object == 'inline') {
          switch (obj.type) {
            case 'link':
              return <a href={obj.data.get('href')}>{children}</a>;
          }
        }
      },
    },
  ];
  const html = new Html({ rules });
  const DEFAULT_NODE = 'paragraph';

  const editor = useRef();

  const [richText, setRichText] = useState({ value: Value.fromJSON(html.deserialize(props.richText)) });

  const wrapLink = (editor, href) => {
    editor.wrapInline({
      type: 'link',
      data: { href },
    });

    editor.moveToEnd();
  };

  const unwrapLink = (editor) => {
    editor.unwrapInline('link');
  };

  const hasMark = type => {
    const { value } = richText;
    return value.activeMarks.some(mark => mark.type === type);
  };

  const hasBlock = type => {
    const { value } = richText;
    return value.blocks.some(node => node.type === type);
  };

  const hasLinks = () => {
    const { value } = richText;
    return value.inlines.some(inline => inline.type === 'link');
  };

  const renderMarkButton = (type, icon) => {
    const isActive = hasMark(type);

    return (
      <Button
        classes={{ text: classes.button }}
        active={isActive.toString()}
        onMouseDown={event => onClickMark(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    );
  };

  const renderLinkButton = (type, icon) => {
    return (
      <Button active={hasLinks().toString()} onMouseDown={onClickLink}>
        <Icon>{icon}</Icon>
      </Button>
    );
  };

  const renderBlockButton = (type, icon) => {
    let isActive = hasBlock(type);

    if (['numbered-list', 'bulleted-list'].includes(type)) {
      const { value: { document, blocks } } = richText;

      if (blocks.size > 0) {
        const parent = document.getParent(blocks.first().key);
        isActive = hasBlock('list-item') && parent && parent.type === type;
      }
    }

    return (
      <Button
        classes={{ text: classes.button }}
        active={isActive.toString()}
        onMouseDown={event => onClickBlock(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    );
  };

  const renderBlock = (props, editor, next) => {
    const { attributes, children, node } = props;

    switch (node.type) {
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>;
      case 'heading':
        return <h3 {...attributes}>{children}</h3>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>;
      default:
        return next();
    }
  };

  const renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>;
      case 'italic':
        return <em {...attributes}>{children}</em>;
      case 'underlined':
        return <u {...attributes}>{children}</u>;
      default:
        return next();
    }
  };

  const renderInline = (props, editor, next) => {
    const { attributes, children, node } = props;

    switch (node.type) {
      case 'link': {
        const { data } = node;
        const href = data.get('href');
        return (
          <a {...attributes} href={href}>
            {children}
          </a>
        );
      }

      default: {
        return next();
      }
    }
  };

  const onChange = ({ value }) => {
    // When the document changes, save the serialized HTML to Redux.
    if (value.document != richText.value.document) {
      const string = html.serialize(value);
      props.handleChange(string);
    }

    setRichText({ value });
  };

  const onClickMark = (event, type) => {
    event.preventDefault();
    editor.current.toggleMark(type);
  };

  const onClickBlock = (event, type) => {
    event.preventDefault();

    const { value } = editor.current;
    const { document } = value;

    // Handle everything but list buttons.
    if (type !== 'bulleted-list' && type !== 'numbered-list') {
      const isActive = hasBlock(type);
      const isList = hasBlock('list-item');

      if (isList) {
        editor.current
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else {
        editor.current.setBlocks(isActive ? DEFAULT_NODE : type);
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = hasBlock('list-item');
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type === type);
      });

      if (isList && isType) {
        editor.current
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else if (isList) {
        editor.current
          .unwrapBlock(
            type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          .wrapBlock(type);
      } else {
        editor.current.setBlocks('list-item').wrapBlock(type);
      }
    }
  };

  const onClickLink = event => {
    event.preventDefault();

    const { value } = editor.current;

    if (hasLinks()) {
      editor.current.command(unwrapLink);
    } else if (value.selection.isExpanded) {
      const href = window.prompt('Enter the URL of the link:');

      if (href == null) {
        return;
      }

      editor.current.command(wrapLink, href)
    } else {
      const href = window.prompt('Enter the URL of the link:');

      if (href == null) {
        return;
      }

      const text = window.prompt('Enter the text for the link:');

      if (text == null) {
        return;
      }

      editor.current
        .insertText(text)
        .moveFocusBackward(text.length)
        .command(wrapLink, href);
    }
  };

  const onPaste = (event, editor, next) => {
    if (editor.value.selection.isCollapsed) return next();

    const transfer = getEventTransfer(event)
    const { type, text } = transfer;
    if (type !== 'text' && type !== 'html') return next();
    if (!isUrl(text)) return next()

    if (hasLinks()) {
      editor.command(unwrapLink)
    }

    editor.command(wrapLink, text)
  };

  return (
    <>
      <Toolbar
        classes={{ root: classes.toolbar }}
      >
        {renderMarkButton('bold', 'format_bold')}
        {renderMarkButton('italic', 'format_italic')}
        {renderMarkButton('underlined', 'format_underlined')}
        {renderBlockButton('heading', 'format_size')}
        {renderBlockButton('block-quote', 'format_quote')}
        {renderBlockButton('numbered-list', 'format_list_numbered')}
        {renderBlockButton('bulleted-list', 'format_list_bulleted')}
        {renderLinkButton('link', 'link')}
      </Toolbar>
      <Editor
        className={classes.editor}
        spellCheck
        autoFocus
        placeholder="Enter text here..."
        ref={editor}
        defaultValue={richText.value}
        onChange={onChange}
        onPaste={onPaste}
        renderBlock={renderBlock}
        renderMark={renderMark}
        renderInline={renderInline}
      />
    </>
  );
};

RichTextEditor.propTypes = {
  richText: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired
};

export default RichTextEditor;
