import { ElementProperties, TagStringParseResult, Subscriber, Template } from './types';

/**
 * 
 * @param str A string to parse.
 * @returns A `TagStringParseResult` object containing the parsed information.
 * @internal
 */
const _parseEltString = (str: string | undefined): TagStringParseResult => {
    const matches = str ? str.match(/([0-9a-zA-Z\-]*)?(#[0-9a-zA-Z\-]*)?((.[0-9a-zA-Z\-]+)*)/) : undefined;
    const results = matches ? matches.slice(1, 4)?.map((elem) => elem ? elem.trim() : undefined) : Array(3).fill(undefined);

    if (results && results[1]) results[1] = results[1].replace(/#*/g, "");

    return matches ? {
        tag: results[0] || undefined,
        id: results[1] || undefined,
        classes: results[2] ? results[2].split('.').filter((elem: string) => elem.trim()) : undefined
    } : {};
};

/**
 * An element creation helper.
 * @param {string} eltInfo Basic information about the element.
 * `eltInfo` should be a string of the format `tagName#id.class1.class2`.
 * Each part (tag name, id, classes) is optional, and an infinite number of
 * classes is allowed. When `eltInfo` is an empty string, the tag name is assumed to be
 * `div`.
 * @param args - Optional extra properties for the created element.
 * @returns The newly created DOM element.
 */
const nu = (eltInfo: string, args: ElementProperties = {}) => {
    let { innerHTML, i, misc, m, style, s, on: handlers, attrs, a } = args;

    let { tag, id, classes } = _parseEltString(eltInfo);

    if (!tag) tag = 'div';
    let elem = document.createElement(tag);

    if (id) elem.id = id;

    if (classes) {
        classes.forEach((cls) => elem.classList.add(cls));
    }

    innerHTML = innerHTML || i;
    misc = misc || m;
    style = style || s;
    attrs = attrs || a;

    if (innerHTML) elem.innerHTML = innerHTML;
    if (misc) Object.assign(elem, misc);
    if (style) Object.assign(elem.style, style);
    if (handlers) for (const handler in handlers) elem.addEventListener(handler, handlers[handler]);
    if (attrs) for (const attr in attrs) elem.setAttribute(attr, attrs[attr]);

    return elem;
}

/**
 * A simple reactive store.
 * @class Store
 * @public
 */
class Store {
    /**  The value of the store. */
    value: unknown = null;
    /** 
     * The subscribers currently registered to the store. 
     * @internal
    */
    _subscribers: Record<string, Record<number, Subscriber>> = {};
    /** 
     * The subscribers currently registered to the store. 
     * @internal
    */
    _subscriberCounts: Record<string, number> = {};
    /**
     * A value describing whether or not the store has been disposed of.
     * @internal
     */
    _dead = false;

    /**
     * Creates an instance of Store.
     * @param value - The initial value of the store.
     */
    constructor(value: unknown) {
        this.value = value;
    }

    /**
     * 
     * @param type The type of event to listen for.
     * @param fn A function that will be called every time the store experiences an event of type `type`.
     * @param callNow Whether the function should be called once with the current value of the store.
     * The function will not be called for ListStore events "push", "remove", or "mutation".
     * @returns A number which can be passed to `Store.unsubscribe` to stop `fn` from being called from then on.
     */
    on(type: string, fn: Subscriber, callNow: boolean = false): number {
        this._subscriberCounts[type] = this._subscriberCounts[type] || 0;
        this._subscribers[type] = this._subscribers[type] || {};

        this._subscribers[type][this._subscriberCounts[type]] = fn;
        if (callNow && !["push", "remove", "mutation", "setAt"].includes(type)) {
            fn(this.value);
        }
        return this._subscriberCounts[type]++;
    }
    /**
     * 
     * @param type The type of event to unsubscribe from.
     * @param id The value returned by `Store.on` when the subscriber was registered.
     */
    unsubscribe(type: string, id: number) {
        delete this._subscribers[type][id];
    }

    /**
     * Sets the value of the store to be `value`. All subscribers to the "update" event are called.
     * @param value The new value to store.
     */
    update(value: unknown) {
        if (this._dead) return;
        this.value = value;
        this._sendEvent("update", value);
    }
    /**
     * Forces all subscribers to the "update" event to be called.
     * @param value The new value to store.
     */
    refresh() {
        this._sendEvent("refresh", this.value);
    }

    /**
     * Sends an event to all subscribers if the store has not been disposed of.
     * @internal
    */
    _sendEvent(type: string, value: unknown) {
        if (this._dead) return;
        this._subscribers[type] = this._subscribers[type] || {};
        for (const idx in Object.keys(this._subscribers[type])) {
            this._subscribers[type][idx](value);
        }
    }

    /**
     * Close the store so it no longer sends events.
     */
    dispose() {
        this._dead = true;
        this._subscribers = {};
        this._subscriberCounts = {};
    }
}
/**
    * A reactive list store. 
    * Implements push(item). remove(idx), get(idx), and setAt(idx, item).
    * push() sends a "push" event
    * remove() sends a "remove" event
    * setAt() sends a "mutation" event
*/
class ListStore extends Store {
    value: unknown[];

    constructor(ls: unknown[]) {
        super(ls);
    }

    clear() {
        this.update([]);
    }

    /**
     * Append the value `val` to the end of the list. This method sends a "push" event, 
     * with the value being an object with the properties:
     * * `value`: the value that was pushed
     * * `idx`: the index of the new value.
     * @param val The value to append.
     */
    push(val: unknown) {
        this.value.push(val);
        this._sendEvent("push", {
            value: val,
            idx: this.value.length - 1
        });
    }

    /**
     * Remove the element at the index `idx`. This method sends a "remove" event, 
     * with the value being an object with the properties:
     * * `value`: the value that was removed
     * * `idx`: the index the removed value was at
     * @param val The value to append.
     */
    remove(idx: number) {
        if (idx < 0 || idx >= this.value.length) throw new RangeError("Invalid index.");
        this._sendEvent("remove", {
            value: this.value.splice(idx, 1)[0],
            idx: idx
        });
    }

    /**
     * Retrieves the value at the given index.
     * @param idx The index of the value to retrieve.
     * @returns The value at the index `idx`. 
     */
    get(idx: number) {
        if (idx < 0 || idx > this.value.length) throw new RangeError("Invalid index.");
        return this.value instanceof Array && this.value[idx];
    }

    /**
     * Sets the element at the given index `idx` to the value `val`. Sends a mutation event
     * with the value being an object bearing the properties:
     * @param idx The index to mutate.
     * @param val the new value at that index.
     */
    setAt(idx: number, val: unknown) {
        if (idx < 0 || idx >= this.value.length) throw new RangeError("Invalid index.");
        this.value[idx] = val;
        this._sendEvent("mutation", {
            value: val,
            idx: idx,
        });
    }

    /**
     * Utility accessor to find the length of the store.
     */
    get length() {
        return this.value.length;
    }
}

/**
 * Applies mustache templating to a string. Any names surrounded by {{ }} will be
 * considered for templating: if the name is present as a property in `data`,
 * the mustache'd expression will be replaced with the value of the property in `data`.
 * Prefixing the opening {{ with double backslashes will escape the expression.
 * @param string - the string to be templated.
 * @param data - The data which will be used to perform replacements.
 * @returns the templated string.
*/
const mustache = (string: string, data: Record<string, string> = {}): string => {
    const escapeExpr = new RegExp("\\\\({{\\s*"+Object.keys(data).join("|") + "\\s*}})","gi");
    new RegExp(Object.keys(data).join("|"),"gi");
    return string.replace(new RegExp("(^|[^\\\\]){{\\s*("+Object.keys(data).join("|") + ")\\s*}}","gi"), function(matched, p1, p2) {
        return `${p1 || ""}${data[p2]}`;
    }).replace(escapeExpr, '$1');
}

/**
 * Returns a partial application that can be used to generate templated HTML strings.
 * Does not sanitize html, use with caution.
 * @param str - A string with mustaches in it. (For example: 
 * `<span class='name'> {{ name }} </span>`)
 * @returns A function that when passed an Object with templating data,
 * returns the result of the templating operation performed on the string str with
 * the data passed in.
 */
const template = (str: string): Template => {
    return (data: Record<string, string>) => mustache(str, data);
}

/**
 * a simple HTML sanitizer. Escapes `&`, `<`, `>`, `'`, and `"` by 
 * replacing them with their corresponding HTML escapes 
 * (`&amp;`,`&gt;`, `&lt;`, `&#39;`, and `&quot`).
 * @param str A string to escape.
 * @returns The escaped string.
 */
const escape = (str: string) => {
    if (!str) return '';

    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Unescapes the output of escape() by replacing `&amp;`, `&gt;`, `&lt;`,
 * `&#39;`, and `&quot` with `&`, `<`, `>`, `'`, and `"` respectively.
 * @param str A string to unescape.
 * @returns The string, with its character references replaced by the characters it references.
 */
const unescape = (str: string) => {
    if (!str) return '';
    const expr = /&(?:amp|lt|gt|quot|#(0+)?(?:39|96));/g;

    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };

    return str.replace(expr, (entity) => entities[entity] || '\'');
}

export default {
    Store, ListStore, nu, mustache, template, escape, unescape
}

export {
    Store, ListStore, nu, mustache, template, escape, unescape
}