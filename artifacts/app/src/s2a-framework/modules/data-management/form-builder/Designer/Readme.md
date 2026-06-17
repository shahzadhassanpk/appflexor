used `yarn` as package manager. installed `uuid` , `react-dnd` ,
`react-dnd-html5-backend` , `classnames`

Sample data structure of layout

```js
[
    {
        type: ROW,
        id: "row1",
        children: [
            {
                type: COLUMN,
                id: "column2",
                children: [
                    {
                        type: COMPONENT,
                        id: "component0",
                        componnet_id: "component0",
                    },
                    {
                        type: COMPONENT,
                        id: "component1",
                        componnet_id: "component1",
                    },
                    {
                        type: COMPONENT,
                        id: "component2",
                        componnet_id: "component2",
                    },
                ],
            },
        ],
    },
];
```

Sample data structure of components

```js
    {
        component0: {
            id: "component0",
            componnet_id : "component0",
            type: "input",
            content: "Some input",
        },
        component1: {
            id: "component1",
            componnet_id : "component1",
            type: "image",
            content: "Some image",
        },
        component2: {
            id: "component2",
            componnet_id : "component2",
            type: "email",
            content: "Some email",
        },
    }

```

Wrapper for component will handle state between layout and component

```js
const wrapper = {
    title: "",
    authorizations: [
        {
            type: "GROUP",
            value: "ADMIN", // eg: ADMIN - REGISTERED
            permission: "ADMIN", // VIEW - EDIT - ADMIN
        },
        {
            type: "GROUP",
            value: "USER", // eg: ADMIN - REGISTERED
            permission: "VIEW", // VIEW - EDIT - ADMIN
        },
    ],
    component: {
        id: "",
        type: "",
    },
    props: [],
    value: "",
};
```

Component will provide props to this wrapper

```js
const component = {
    props: [
        {
            id: "title",
            label: "Label",
            type: "text", // text, date, options,
            value: "",
            options: [], // optional
            hidden: boolean,
        },
    ],
};
```
