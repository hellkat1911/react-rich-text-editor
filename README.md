## Rich Text Editor
###### React component built with [Slate](https://github.com/ianstormtaylor/slate).

While there are a handful of good rich text editors out there for React, I had a hard time finding one that didn't need to be customized from the ground up. This component is ready to go as-is with the basic features one expects from a rich text editor, while also providing a solid base for those with more complex requirements.

To use this component, the following packages are required:

1. react (16.8 or later)
2. slate (0.47.8 or later)
3. slate-react
4. slate-html-serializer

It also uses the **material-ui component framework** for UI elements, but this is implementation-specific and can be replaced to fit with your use case. Styles are also **material-ui** and can be replaced with any other React-compatible styling solution.

The editor is written as a functional component to take advantage of React hooks. As written, it enables plaintext, bold, italic, underline, blockquote, title (h4), ordered lists, unordered lists, and links. The selection of elements and the way the elements render are all completely customizable. It makes very basic assumptions about what these elements should look like and act like. That being said, the link behavior is _very_ basic, and uses window.prompt to collect the href/text data for the link.

The component is also written to enable storing the generated rich text to an arbitrary location (a database, Redux, Local Storage, etc). Its parent should pass two props:

1. **richText** - an HTML string that represents the initial value of the editor (passing empty string will initialize the editor to empty, and show the placeholder text instead)
2. **handleChange** - a function that updates the stored representation of the data

The component code includes serialize/deserialize rules to convert the data between the JSON object schema used by the editor and the HTML string representation used to display the rich text. Anytime you add a new mark/block/inline to the editor, you need to add a corresponding rule for serialization and deserialization (more info can be found [here](https://docs.slatejs.org/walkthroughs/saving-and-loading-html-content)).

That's it :) The rendered editor text is only read in from storage on first render, and handled by local state after that. The stored output is updated on every onChange event (this can be tweaked if performance becomes an issue).
