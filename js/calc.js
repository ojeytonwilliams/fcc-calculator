"use strict";

Vue.component("digit-elem", {
  props: ["digitprop"],
  template:
    '<button v-on:click="numberClick(digitprop.text,$event)" v-bind:class="digitprop.class">{{ digitprop.text }}</button>',
  methods: {
    numberClick: function(id, event) {
      app.calcHistory.push(id);
      app.error = null;
    }
  }
});

//var calcHistory = [];
//var output = " ";
var arithOps = ["/", "×", "+", "-"];
var zeroToNine = [...Array(10)].map((x, id) => id);

var app = new Vue({
  el: "#app",
  data: {
    digits: [...Array(10)].map((x, id) => ({
      text: id,
      class: `num-${id}`
    })),
    output: " ",
    calcHistory: [],
    error: null
  },
  computed: {
    history: function() {
      return this.calcHistory.join("");
    }
  },
  methods: {
    appendHistory: function(sym) {
      var last = this.calcHistory[this.calcHistory.length - 1];
      var nextToLast = this.calcHistory[this.calcHistory.length - 2];
      if (sym === ".") {
        if (validDots(this.calcHistory.join(""))) {
          this.calcHistory.push(sym);
        }
      } else if (arithOps.includes(last)) {
        // There's another edge case, when we start with a minus operator!

        // If the last two symbols are operators, we're not allowed to add more
        if (notStackedOperators(this.calcHistory)) {
          // Then, *unless* the new sym is '-' and the
          // previous entry is multiply or divide
          // we should just replace it with the new
          // symbol.
          if (sym !== "-" || (last !== "×" && last !== "/")) {
            this.calcHistory.pop();
          }
          // In all cases the new operator should be
          // appended.
          this.calcHistory.push(sym);
        }
      } else if (arithOps.includes(sym)) {
        // There's an edge case where invalid input is still allowed.  If the last entry is '.' and the penultimate entry must be a number
        if (last === ".") {
          // If the last entry is '.' and the penultimate entry might not be a
          // number (i.e. if there isn't one!) we could have a problem.
          console.log("Edge case test, last", last);
          console.log("nextToLast", nextToLast);
          if (zeroToNine.includes(nextToLast)) {
            // If the penultimate entry is a number, it's fine
            this.calcHistory.push(sym);
          }
        } else if (!last && sym !== "-") {
          // do nothing, because we can't start with any operators, except minus
        } else {
          this.calcHistory.push(sym);
        }
      } else {
        // The last entry is not an operator and the
        // new entry is not '.', so we can add it.
        this.calcHistory.push(sym);
      }

      app.error = null;
      //  this.history = calcHistory.join("");
    },
    compute: function() {
      // mathjs doesn't recognise × as an operator,
      // so we replace it with *

      var computed;
      try {
        computed = math.eval(
          this.calcHistory.map(x => (x == "×" ? "*" : x)).join("")
        );
        console.log("computed", computed);
        computed = computed.toPrecision(15);
      } catch (error) {
        this.error = "Error";
        console.log(error);
      }
      if (computed == undefined) {
        this.error = "Error";
      } else {
        console.log("about to trim", computed);
        console.log("trim result", trimTrailingZeros(computed));
        this.output = "=" + trimTrailingZeros(computed);
      }
    },
    allClear: function() {
      // After a bit of trial and error, I've come to
      // the conclusion that splice is (probably) the
      // best way to empty an array while using Vue.       // It's less clear than arr = [], but Vue
      // detects changes by wrapping array methods.
      // If you don't invoke said methods, Vue
      // doesn't seem to notice anything has changed.
      //
      // Give that we're using a method, splice is
      // decently fast.
      //
      // EXTRA WEIRDNESS: Vue *does* notice if you
      // change both this.arr and arr, but not if you
      // only change one.  Why? No clue.
      //  this.calcHistory.splice(0, calcHistory.length);
      // FINAL EDIT: actually, it depends where your
      // data lives.  If you have an *external*
      // object, you need to use splice or some other
      // wrapped array method (AFAIK).  However,
      // if you only refer to this.arr or app.arr,
      // then you can use more obvious stuff like
      // this.arr = [];
      // Intriguingly, you still can't use
      // this.arr.length = 0;
      // Vue does not pick up on that!
      this.calcHistory = [];
      this.output = "";
      app.error = null;
    },
    clearEntry: function() {
      this.calcHistory.pop();
      app.error = null;
    }
  }
});

function validDots(history) {
  // The last operator is not arithmetic, and
  // if the new operation is '.' we can only
  // add it if the history after the last
  // operator contains no points
  var hasDots = /([*\\+-]\d*\.\d*$)|\d*\.\d*$/;
  return !hasDots.test(history);
}

function notStackedOperators(history) {
  var last = history[history.length - 1];
  if (history.length > 1) {
    var nextToLast = history[history.length - 2];
    // if either one of the last two operations is not an
    // arithmetic operator, we're not in danger of stacking
    // operators too much.
    return !arithOps.includes(nextToLast) || !arithOps.includes(last);
  } else {
    // If the only operator is -, we're not allowed to replace it.
    return last !== "-";
  }
}

function trimTrailingZeros(str) {
  // This matches a dot with trailing zeros or a dot with stuff then not-zero and finally zeros.  We only keep the dot if there's non-zero stuff after it (which we also keep.)
  return str.replace(/\.0+$|(\..*[^0])0+$/, "$1");
}

