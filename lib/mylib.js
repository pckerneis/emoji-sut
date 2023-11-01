"use strict";
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
function hasChildren(object) {
    return object.children != null && typeof object.children === 'object';
}
function resolveSelector(child, sentence) {
    if (typeof child.selector === 'function') {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            sentence.selectorArgs.set(child, args);
            sentence.currentObject = child;
            return proxify(sentence);
        };
    }
    else {
        sentence.currentObject = child;
        return proxify(sentence);
    }
}
// Returning `any` here because TS doen't want me to be more specific
function proxify(sentence) {
    return new Proxy(sentence, {
        get: function (target, name) {
            if (sentence.currentObject != null) {
                // Resolve from current object's children
                if (hasChildren(sentence.currentObject)) {
                    if (Object.prototype.hasOwnProperty.call(sentence.currentObject.children, name)) {
                        var child = sentence.currentObject.children[name];
                        return resolveSelector(child, sentence);
                    }
                }
                // Resolve from current object's siblings
                var hierarchy = sentence.hierarchyByObject.get(sentence.currentObject);
                var parent_1 = hierarchy[hierarchy.length - 2];
                if (parent_1 && hasChildren(parent_1)) {
                    if (Object.prototype.hasOwnProperty.call(parent_1.children, name)) {
                        var sibling = parent_1.children[name];
                        return resolveSelector(sibling, sentence);
                    }
                }
            }
            // Resolve from root
            if (Object.prototype.hasOwnProperty.call(sentence.sentenceContext.pageObjects, name)) {
                var rootObject = sentence.sentenceContext.pageObjects[name];
                return resolveSelector(rootObject, sentence);
            }
            return target[name];
        },
    });
}
var Sentence = /** @class */ (function () {
    function Sentence(sentenceContext, adapter) {
        var _this = this;
        this.sentenceContext = sentenceContext;
        this.adapter = adapter;
        this.hierarchyByObject = new Map();
        this.selectorArgs = new Map();
        this.as = function (party) {
            if (typeof party === 'string') {
                _this.currentParty = _this.findParty(party);
            }
            else {
                _this.currentParty = party;
            }
            // TODO
            // this.currentTarget = this.currentParty;
            return proxify(_this);
        };
        Object.keys(sentenceContext.pageObjects).forEach(function (name) {
            var pageObject = sentenceContext.pageObjects[name];
            _this.hierarchyByObject.set(pageObject, [pageObject]);
            if (hasChildren(pageObject)) {
                _this.visitChildren(pageObject, [pageObject]);
            }
        });
    }
    Sentence.prototype.visitChildren = function (parent, path) {
        var _this = this;
        Object.keys(parent.children).forEach(function (name) {
            var child = parent.children[name];
            _this.hierarchyByObject.set(child, __spreadArray(__spreadArray([], path, true), [child], false));
            if (hasChildren(child)) {
                _this.visitChildren(child, __spreadArray(__spreadArray([], path, true), [child], false));
            }
        });
    };
    Sentence.given = function (sentenceContext, adapter) {
        var sentence = new Sentence(sentenceContext, adapter);
        return proxify(sentence);
    };
    Object.defineProperty(Sentence.prototype, "when", {
        get: function () {
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "then", {
        get: function () {
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Sentence.prototype.findParty = function (name) {
        return this.sentenceContext.parties[name];
    };
    Object.defineProperty(Sentence.prototype, "I", {
        get: function () {
            // TODO
            // this.currentTarget = this.currentParty;
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "it", {
        get: function () {
            // TODO
            // this.currentTarget = this.currentObject;
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "and", {
        get: function () {
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Sentence.prototype.visit = function (url) {
        this.adapter.visit(url);
        return proxify(this);
    };
    Object.defineProperty(Sentence.prototype, "isVisible", {
        get: function () {
            return this.should('be.visible');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "isNotVisible", {
        get: function () {
            return this.should('not.be.visible');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "doesNotExist", {
        get: function () {
            return this.should('not.exist');
        },
        enumerable: false,
        configurable: true
    });
    Sentence.prototype.should = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.adapter
            .select(this.buildPath()))
            .should.apply(_a, args);
        return proxify(this);
    };
    Sentence.prototype.hasText = function (expectedText) {
        return this.should('have.text', expectedText);
    };
    Sentence.prototype.typeText = function (text) {
        this.adapter
            .select(this.buildPath())
            .type(text);
        return proxify(this);
    };
    Sentence.prototype.click = function () {
        this.adapter
            .select(this.buildPath())
            .click();
        return proxify(this);
    };
    Sentence.prototype.buildPath = function () {
        var _this = this;
        return this.hierarchyByObject.get(this.currentObject).map(function (object) {
            if (typeof object.selector === 'function') {
                return object.selector.apply(object, _this.selectorArgs.get(object));
            }
            else {
                return object.selector;
            }
        });
    };
    return Sentence;
}());
exports.default = Sentence;
