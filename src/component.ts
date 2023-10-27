// @ts-expect-error
const BdApi = window.BdApi;
const ce = BdApi.React.createElement;
const { useState } = BdApi.React;

export default function MyComponent({ disabled = false }) {
	const [isDisabled, setDisabled] = useState(disabled);
	return ce('button', { className: 'my-component', disabled: isDisabled }, 'Hello World!');
}
