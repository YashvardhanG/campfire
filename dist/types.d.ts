/** A signature for a subscriber type. */
export declare type Subscriber = (value: unknown) => void;
/** A generic signature for an event handler type. */
export declare type EventHandler = (e: Event) => unknown;
/** The function signature for a function returned by `template()`. */
export declare type Template = (e: Record<string, unknown>) => string;
/**
 * Properties for the HTML element to be created.
 */
export interface ElementProperties {
    /** String that will be set as the inner HTML of the created element. */
    innerHTML?: string;
    /** Alias for `ElementProperties.innerHTML`. */
    i?: string;
    /** Miscellaneous properties to set on the created element,
    * for example, `type: "button"` or `checked: true`
    */
    misc?: Record<string, unknown>;
    /** Alias for `ElementProperties.misc`. */
    m?: Record<string, unknown>;
    /** Contains styles that will be applied to the new element. Property names must be the same as those in `CSSStyleDeclaration`. */
    style?: Record<string, unknown>;
    /** Alias for `ElementProperties.style`. */
    s?: Record<string, unknown>;
    /** An object containing event handlers that will be applied using addEventListener.
     * For example: `{'click': (e) => console.log(e)}`
     */
    on?: Record<string, EventHandler>;
    /** Attributes that will be set on the newly created element using `Element.setAttribute`. */
    attrs?: Record<string, string>;
    /** Alias for `ElementProperties.attrs`. */
    a?: Record<string, string>;
}
/**
 * An interface to store data parsed from an element descriptor string passed to `nu`.
 * @internal
 */
export interface TagStringParseResult {
    /** The tagName parsed from the info string. */
    tag?: string | undefined;
    /** The id parsed from the info string. */
    id?: string | undefined;
    /** An array of classes parsed from the info string. */
    classes?: string[] | undefined;
}
