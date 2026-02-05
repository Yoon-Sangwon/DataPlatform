const propertiesOrder = {
    "heading": [
        "content",
        "quotes",
    ],
    "box": [
        [
            "display",
            "visibility",
        ],
        [
            "position",
            "top",
            "right",
            "bottom",
            "left",
            "z-index",
        ],
        [
            "box-sizing",
        ],
        [
            "grid",
            "grid-area",

            "grid-before",
            "grid-start",
            "grid-after",
            "grid-end",

            "grid-auto-rows",
            "grid-auto-columns",
            "grid-auto-flow",

            "grid-row",
            "grid-row-start",
            "grid-row-end",
            "grid-row-gap",
            "grid-rows",

            "grid-column",
            "grid-column-start",
            "grid-column-end",
            "grid-column-gap",
            "grid-columns",

            "grid-gap",

            "grid-template",
            "grid-template-areas",
            "grid-template-rows",
            "grid-template-columns",
        ],
        [
            "flex-direction",
            "flex-wrap",
            "flex-flow",
            "justify-content",
            "align-items",
            "align-content",
            "gap",
            "order",
            "align-self",
            "flex",
            "flex-grow",
            "flex-shrink",
            "flex-basis",
        ],
        [
            "width",
            "min-width",
            "max-width"
        ],
        [
            "height",
            "min-height",
            "max-height"
        ],
        [
            "block-size",
            "min-block-size",
            "max-block-size"
        ],
        [
            "inline-size",
            "min-inline-size",
            "max-inline-size"
        ],
        [
            "margin",
            "margin-top",
            "margin-right",
            "margin-bottom",
            "margin-left"
        ],
        [
            "margin-block",
            "margin-block-start",
            "margin-block-end"
        ],
        [
            "margin-inline",
            "margin-inline-start",
            "margin-inline-end"
        ],
        [
            "padding",
            "padding-top",
            "padding-right",
            "padding-bottom",
            "padding-left"
        ],
        [
            "padding-block",
            "padding-block-start",
            "padding-block-end"
        ],
        [
            "padding-inline",
            "padding-inline-start",
            "padding-inline-end"
        ],
        [
            "float",
            "clear"
        ],
        [
            "overflow",
            "overflow-x",
            "overflow-y"
        ],
        [
            "clip",
            "zoom"
        ],
        [
            "columns",
            "column-gap",
            "column-fill",
            "column-rule",
            "column-span",
            "column-count",
            "column-width"
        ],
        [
            "table-layout",
            "empty-cells",
            "caption-side",
            "border-spacing",
            "border-collapse",
            "list-style",
            "list-style-position",
            "list-style-type",
            "list-style-image"
        ]
    ],
    "border": [
        [
            "border",
            "border-top",
            "border-right",
            "border-bottom",
            "border-left",
            "border-width",
            "border-top-width",
            "border-right-width",
            "border-bottom-width",
            "border-left-width"
        ],
        [
            "border-style",
            "border-top-style",
            "border-right-style",
            "border-bottom-style",
            "border-left-style"
        ],
        [
            "border-radius",
            "border-top-left-radius",
            "border-top-right-radius",
            "border-bottom-right-radius",
            "border-bottom-left-radius"
        ],
        [
            "border-color",
            "border-top-color",
            "border-right-color",
            "border-bottom-color",
            "border-left-color"
        ],
        [
            "outline",
            "outline-color",
            "outline-offset",
            "outline-style",
            "outline-width"
        ],
        [
            "stroke-width",
            "stroke-linecap",
            "stroke-dasharray",
            "stroke-dashoffset",
            "stroke"
        ]
    ],
    "background": [
        [
            "opacity"
        ],
        [
            "background",
            "background-attachment",
            "background-clip",
            "background-color",
            "background-image",
            "background-repeat",
            "background-position",
            "background-size",
            "box-shadow",
            "fill"
        ]
    ],
    "text": [
        [
            "color"
        ],
        [
            "font",
            "font-family",
            "font-size",
            "font-size-adjust",
            "font-smoothing",
            "font-stretch",
            "font-style",
            "font-variant",
            "font-weight"
        ],
        [
            "font-emphasize",
            "font-emphasize-position",
            "font-emphasize-style"
        ],
        [
            "letter-spacing",
            "line-height",
            "list-style"
        ],
        [
            "text-align",
            "text-align-last",
            "text-decoration",
            "text-decoration-color",
            "text-decoration-line",
            "text-decoration-style",
            "text-indent",
            "text-justify",
            "text-overflow",
            "text-overflow-ellipsis",
            "text-overflow-mode",
            "text-rendering",
            "text-outline",
            "text-shadow",
            "text-transform",
            "text-wrap",
            "word-wrap",
            "word-break"
        ],
        [
            "text-emphasis",
            "text-emphasis-color",
            "text-emphasis-style",
            "text-emphasis-position"
        ],
        [
            "vertical-align",
            "white-space",
            "word-spacing",
            "hyphens"
        ],
        [
            "src"
        ]
    ],
    "animation": [
        [
            "transform",
            "transform-box",
            "transform-origin",
            "transform-style",
            "backface-visibility",
            "perspective",
            "perspective-origin"
        ],
        [
            "transition",
            "transition-property",
            "transition-duration",
            "transition-timing-function",
            "transition-delay"
        ],
        [
            "animation",
            "animation-name",
            "animation-duration",
            "animation-play-state",
            "animation-timing-function",
            "animation-delay",
            "animation-iteration-count",
            "animation-direction"
        ]
    ],
    "other": [
        [
            "tab-size",
            "counter-reset",
            "counter-increment",
            "resize",
            "cursor",
            "pointer-events",
            "speak",
            "user-select",
            "nav-index",
            "nav-up",
            "nav-right",
            "nav-down",
            "nav-left"
        ]
    ]
};

const propertiesOrderKeys = Object.keys(propertiesOrder);

const propertiesOrderOptions =  propertiesOrderKeys.reduce((config, key) => {
    const groupName = key;
    const groupCurrent = propertiesOrder[key];
    const hasNestedGroups = groupCurrent.every((item) => Array.isArray(item));

    let properties = groupCurrent;

    if (hasNestedGroups) {
        properties = groupCurrent.reduce((arr, item) => [...arr, ...item], []);
    }

    return [...config, { groupName, properties }];
}, []);

module.exports = {
    "extends": ["stylelint-config-recommended-scss"],
    "plugins": ["stylelint-order"],
    "rules": {
        "scss/at-import-partial-extension": null,
        "selector-pseudo-class-no-unknown": null,
        "length-zero-no-unit": true,
        "declaration-empty-line-before": ["always", {
            "ignore": ["after-comment", "after-declaration", "first-nested", "inside-single-line-block"]
        }],

        "order/order": [
            "at-rules",
            "declarations",
        ],
        'order/properties-order': [propertiesOrderOptions],
    }
}
