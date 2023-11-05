"use strict";
// TODO
//  - Add tests
//  - Better error reporting (e.g. state machine for expected fragments)
//  - Report dangling queued actions (add a "finisher" to be called in afterEach hooks)
//  - Add more actions
//  - Add more assertions
//  - Add more adapters
//  - Documentation
//  - Examples
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContextDefinition = void 0;
var actions_1 = require("./actions");
var page_objects_1 = require("./page-objects");
var proxy_1 = require("./proxy");
var path_1 = require("./path");
var Sentence = /** @class */ (function () {
    function Sentence(sentenceContext, adapter) {
        var _this = this;
        this.adapter = adapter;
        this.currentObjectPath = [];
        this.selectorArgs = new Map();
        /**
         * Switches the current party to the given one.
         * @param party - The party to switch to. Can be either a string (party name) or a Party object.
         */
        this.as = function (party) {
            if (typeof party === 'string') {
                _this.currentParty = _this.findParty(party);
            }
            else {
                _this.currentParty = party;
            }
            _this.performQueuedAction();
            return (0, proxy_1.proxify)(_this);
        };
        this.sentenceContext = {
            parties: __assign({}, sentenceContext.parties),
            pageObjects: Object.keys(sentenceContext.pageObjects).reduce(function (acc, name) {
                var nodeDef = sentenceContext.pageObjects[name];
                acc[name] = (0, page_objects_1.transformToPageObjectNodeTree)(nodeDef, [name]);
                return acc;
            }, {}),
        };
    }
    Object.defineProperty(Sentence.prototype, "currentObject", {
        /** Returns the currently selected PageObjectNode */
        get: function () {
            var currentObject = null;
            for (var _i = 0, _a = this.currentObjectPath; _i < _a.length; _i++) {
                var name_1 = _a[_i];
                if (currentObject == null) {
                    currentObject = this.sentenceContext.pageObjects[name_1];
                }
                else {
                    currentObject = currentObject.children[name_1];
                }
            }
            return currentObject;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Creates a new sentence with a given context and adapter
     * @param sentenceContext - The context of the sentence, defining the available Page Objects and the Parties
     * @param adapter - The adapter to use for interacting with the application
     */
    Sentence.given = function (sentenceContext, adapter) {
        validateContextDefinition(sentenceContext);
        var sentence = new Sentence(sentenceContext, adapter);
        return (0, proxy_1.proxify)(sentence);
    };
    Object.defineProperty(Sentence.prototype, "when", {
        /**
         * Syntax element usually used to mark a precondition or a user action.
         * If there's a queued action, it will be performed before the next action.
         */
        get: function () {
            this.performQueuedAction();
            return (0, proxy_1.proxify)(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "then", {
        /**
         * Syntax element usually used to mark an assertion.
         * If there's a queued action, it will be performed before the next action.
         */
        get: function () {
            this.performQueuedAction();
            return (0, proxy_1.proxify)(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "I", {
        /**
         * Set the current target to the current party.
         */
        get: function () {
            // Noop
            return (0, proxy_1.proxify)(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "it", {
        /** Set the current target to the current object. */
        get: function () {
            // Noop
            return (0, proxy_1.proxify)(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "and", {
        /**
         * Syntax element to chain multiple actions or assertions.
         * If there's a queued action, it will be performed before the next action.
         */
        get: function () {
            this.performQueuedAction();
            return (0, proxy_1.proxify)(this);
        },
        enumerable: false,
        configurable: true
    });
    // Assertions
    Sentence.prototype.should = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.adapter.select(this.flattenSelectors())).should.apply(_a, args);
        return (0, proxy_1.proxify)(this);
    };
    /**
     * Assertion to check if the current object is visible.
     */
    Sentence.prototype.shouldBeVisible = function () {
        return this.should('be.visible');
    };
    /**
     * Assertion to check if the current object is not visible.
     */
    Sentence.prototype.shouldNotBeVisible = function () {
        return this.should('not.be.visible');
    };
    /**
     * Assertion to check if the current object does not exist.
     */
    Sentence.prototype.shouldNotExist = function () {
        return this.should('not.exist');
    };
    /**
     * Assertion to check if the current object has a given text.
     * @param expectedText - The expected text
     */
    Sentence.prototype.shouldHaveText = function (expectedText) {
        return this.should('have.text', expectedText);
    };
    // Actions
    /**
     * Action to visit a given URL.
     * @param url
     */
    Sentence.prototype.visit = function (url) {
        this.adapter.visit(url);
        return (0, proxy_1.proxify)(this);
    };
    Object.defineProperty(Sentence.prototype, "typeInto", {
        /**
         * Queues an action to type into the current object.
         * Next fragments should be the target object (with `it` or a page object selector)
         * and the text to type (with `text`).
         */
        get: function () {
            this.queuedAction = (0, actions_1.buildTypeAction)();
            return (0, proxy_1.proxify)(this);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Action to click on the current object.
     */
    Sentence.prototype.clickOn = function () {
        this.queuedAction = (0, actions_1.buildClickAction)();
        return (0, proxy_1.proxify)(this);
    };
    // Action args
    /** Defines a text argument for actions such as `typeInto` */
    Sentence.prototype.text = function (text) {
        this.selectorArgs.set(this.currentObjectPath.join(), [text]);
        return (0, proxy_1.proxify)(this);
    };
    /** Defines an argument for actions by looking into the current party's attributes */
    Sentence.prototype.my = function (key) {
        if (!this.currentParty) {
            throw new Error("No party selected");
        }
        if (!Object.prototype.hasOwnProperty.call(this.currentParty, key)) {
            throw new Error("Party does not have attribute \"".concat(key, "\""));
        }
        this.selectorArgs.set(this.currentObjectPath.join(), [
            this.currentParty[key],
        ]);
        return (0, proxy_1.proxify)(this);
    };
    // Internal
    Sentence.prototype.findParty = function (name) {
        if (!this.sentenceContext.parties[name]) {
            throw new Error("Party \"".concat(name, "\" does not exist"));
        }
        return this.sentenceContext.parties[name];
    };
    Sentence.prototype.flattenSelectors = function () {
        var selectors = [];
        var path = [];
        var node = null;
        for (var _i = 0, _a = this.currentObjectPath; _i < _a.length; _i++) {
            var name_2 = _a[_i];
            path.push(name_2);
            if (node == null) {
                node = this.sentenceContext.pageObjects[name_2];
                selectors.push(this.flattenSelector(node.selector, path));
            }
            else {
                node = node.children[name_2];
                selectors.push(this.flattenSelector(node.selector, path));
            }
        }
        return selectors;
    };
    Sentence.prototype.flattenSelector = function (selector, path) {
        if (typeof selector === 'function') {
            return selector.apply(void 0, this.selectorArgs.get(path.join()));
        }
        else {
            return selector;
        }
    };
    Sentence.prototype.performQueuedAction = function () {
        var queuedAction = this.queuedAction;
        var kind = queuedAction === null || queuedAction === void 0 ? void 0 : queuedAction.kind;
        if (kind == undefined) {
            return;
        }
        switch (kind) {
            case actions_1.ActionKind.click:
                this.click();
                break;
            case actions_1.ActionKind.type:
                var text = this.selectorArgs.get(this.currentObjectPath.join());
                if (!text || text.length === 0) {
                    throw new Error("No text provided for type action");
                }
                this.typeText(text[0]);
                break;
            default:
                throw new Error("Unknown action kind \"".concat(kind, "\""));
        }
        this.queuedAction = null;
    };
    Sentence.prototype.click = function () {
        this.adapter.select(this.flattenSelectors()).click();
        return (0, proxy_1.proxify)(this);
    };
    Sentence.prototype.typeText = function (text) {
        this.adapter.select(this.flattenSelectors()).type(text);
        return (0, proxy_1.proxify)(this);
    };
    return Sentence;
}());
exports.default = Sentence;
function validateContextDefinition(sentenceContext) {
    if (sentenceContext.pageObjects == null) {
        throw new Error('Missing pageObjects');
    }
    Object.keys(sentenceContext.pageObjects).forEach(function (name) {
        validateNodeDefinition(name, [name], sentenceContext.pageObjects[name]);
    });
    if (sentenceContext.parties == null) {
        throw new Error('Missing parties');
    }
}
exports.validateContextDefinition = validateContextDefinition;
function validateNodeDefinition(name, path, nodeDef) {
    validateNodeName(name, path);
    if (typeof nodeDef === 'string') {
        return;
    }
    if (typeof nodeDef === 'function') {
        return;
    }
    if (nodeDef.selector == null) {
        throw new Error("Missing selector for node at path \"".concat((0, path_1.toPrettyPath)(path), "\""));
    }
    var children = nodeDef.children;
    if (children != null) {
        Object.keys(children).forEach(function (name) {
            validateNodeDefinition(name, __spreadArray(__spreadArray([], path, true), [name], false), children[name]);
        });
    }
}
function validateNodeName(name, path) {
    if (name.includes(' ')) {
        throw new Error("Node name \"".concat(name, "\" contains spaces at path \"").concat((0, path_1.toPrettyPath)(path), "\""));
    }
    // We technically could allow any valid JS identifier, but the check
    // is quite complex
    if (!name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
        throw new Error("Node name \"".concat(name, "\" contains invalid characters at path \"").concat((0, path_1.toPrettyPath)(path), "\""));
    }
    // We could also check for JS reserved words here, but the error would be
    // quickly detected by the user anyway
    if (isReservedWord(name)) {
        throw new Error("Node name \"".concat(name, "\" is a reserved word at path \"").concat((0, path_1.toPrettyPath)(path), "\""));
    }
}
function isReservedWord(name) {
    // Dirty and inefficient check, but it's good enough for now and doesn't
    // risk to be out of sync
    var isSentenceMethod = Object.getOwnPropertyNames(Sentence.prototype).includes(name);
    if (isSentenceMethod) {
        return true;
    }
    return ['selector', 'children'].includes(name);
}
