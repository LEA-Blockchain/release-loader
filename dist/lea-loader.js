#!/usr/bin/env node

// cli.js
import fs11 from "fs";
import path8 from "path";
import crypto2 from "crypto";

// node_modules/@isaacs/fs-minipass/dist/esm/index.js
import EE from "events";
import fs from "fs";

// node_modules/minipass/dist/esm/index.js
import { EventEmitter } from "node:events";
import Stream from "node:stream";
import { StringDecoder } from "node:string_decoder";
var proc = typeof process === "object" && process ? process : {
  stdout: null,
  stderr: null
};
var isStream = (s) => !!s && typeof s === "object" && (s instanceof Minipass || s instanceof Stream || isReadable(s) || isWritable(s));
var isReadable = (s) => !!s && typeof s === "object" && s instanceof EventEmitter && typeof s.pipe === "function" && // node core Writable streams have a pipe() method, but it throws
s.pipe !== Stream.Writable.prototype.pipe;
var isWritable = (s) => !!s && typeof s === "object" && s instanceof EventEmitter && typeof s.write === "function" && typeof s.end === "function";
var EOF = Symbol("EOF");
var MAYBE_EMIT_END = Symbol("maybeEmitEnd");
var EMITTED_END = Symbol("emittedEnd");
var EMITTING_END = Symbol("emittingEnd");
var EMITTED_ERROR = Symbol("emittedError");
var CLOSED = Symbol("closed");
var READ = Symbol("read");
var FLUSH = Symbol("flush");
var FLUSHCHUNK = Symbol("flushChunk");
var ENCODING = Symbol("encoding");
var DECODER = Symbol("decoder");
var FLOWING = Symbol("flowing");
var PAUSED = Symbol("paused");
var RESUME = Symbol("resume");
var BUFFER = Symbol("buffer");
var PIPES = Symbol("pipes");
var BUFFERLENGTH = Symbol("bufferLength");
var BUFFERPUSH = Symbol("bufferPush");
var BUFFERSHIFT = Symbol("bufferShift");
var OBJECTMODE = Symbol("objectMode");
var DESTROYED = Symbol("destroyed");
var ERROR = Symbol("error");
var EMITDATA = Symbol("emitData");
var EMITEND = Symbol("emitEnd");
var EMITEND2 = Symbol("emitEnd2");
var ASYNC = Symbol("async");
var ABORT = Symbol("abort");
var ABORTED = Symbol("aborted");
var SIGNAL = Symbol("signal");
var DATALISTENERS = Symbol("dataListeners");
var DISCARDED = Symbol("discarded");
var defer = (fn) => Promise.resolve().then(fn);
var nodefer = (fn) => fn();
var isEndish = (ev) => ev === "end" || ev === "finish" || ev === "prefinish";
var isArrayBufferLike = (b) => b instanceof ArrayBuffer || !!b && typeof b === "object" && b.constructor && b.constructor.name === "ArrayBuffer" && b.byteLength >= 0;
var isArrayBufferView = (b) => !Buffer.isBuffer(b) && ArrayBuffer.isView(b);
var Pipe = class {
  src;
  dest;
  opts;
  ondrain;
  constructor(src, dest, opts) {
    this.src = src;
    this.dest = dest;
    this.opts = opts;
    this.ondrain = () => src[RESUME]();
    this.dest.on("drain", this.ondrain);
  }
  unpipe() {
    this.dest.removeListener("drain", this.ondrain);
  }
  // only here for the prototype
  /* c8 ignore start */
  proxyErrors(_er) {
  }
  /* c8 ignore stop */
  end() {
    this.unpipe();
    if (this.opts.end)
      this.dest.end();
  }
};
var PipeProxyErrors = class extends Pipe {
  unpipe() {
    this.src.removeListener("error", this.proxyErrors);
    super.unpipe();
  }
  constructor(src, dest, opts) {
    super(src, dest, opts);
    this.proxyErrors = (er) => dest.emit("error", er);
    src.on("error", this.proxyErrors);
  }
};
var isObjectModeOptions = (o) => !!o.objectMode;
var isEncodingOptions = (o) => !o.objectMode && !!o.encoding && o.encoding !== "buffer";
var Minipass = class extends EventEmitter {
  [FLOWING] = false;
  [PAUSED] = false;
  [PIPES] = [];
  [BUFFER] = [];
  [OBJECTMODE];
  [ENCODING];
  [ASYNC];
  [DECODER];
  [EOF] = false;
  [EMITTED_END] = false;
  [EMITTING_END] = false;
  [CLOSED] = false;
  [EMITTED_ERROR] = null;
  [BUFFERLENGTH] = 0;
  [DESTROYED] = false;
  [SIGNAL];
  [ABORTED] = false;
  [DATALISTENERS] = 0;
  [DISCARDED] = false;
  /**
   * true if the stream can be written
   */
  writable = true;
  /**
   * true if the stream can be read
   */
  readable = true;
  /**
   * If `RType` is Buffer, then options do not need to be provided.
   * Otherwise, an options object must be provided to specify either
   * {@link Minipass.SharedOptions.objectMode} or
   * {@link Minipass.SharedOptions.encoding}, as appropriate.
   */
  constructor(...args) {
    const options = args[0] || {};
    super();
    if (options.objectMode && typeof options.encoding === "string") {
      throw new TypeError("Encoding and objectMode may not be used together");
    }
    if (isObjectModeOptions(options)) {
      this[OBJECTMODE] = true;
      this[ENCODING] = null;
    } else if (isEncodingOptions(options)) {
      this[ENCODING] = options.encoding;
      this[OBJECTMODE] = false;
    } else {
      this[OBJECTMODE] = false;
      this[ENCODING] = null;
    }
    this[ASYNC] = !!options.async;
    this[DECODER] = this[ENCODING] ? new StringDecoder(this[ENCODING]) : null;
    if (options && options.debugExposeBuffer === true) {
      Object.defineProperty(this, "buffer", { get: () => this[BUFFER] });
    }
    if (options && options.debugExposePipes === true) {
      Object.defineProperty(this, "pipes", { get: () => this[PIPES] });
    }
    const { signal } = options;
    if (signal) {
      this[SIGNAL] = signal;
      if (signal.aborted) {
        this[ABORT]();
      } else {
        signal.addEventListener("abort", () => this[ABORT]());
      }
    }
  }
  /**
   * The amount of data stored in the buffer waiting to be read.
   *
   * For Buffer strings, this will be the total byte length.
   * For string encoding streams, this will be the string character length,
   * according to JavaScript's `string.length` logic.
   * For objectMode streams, this is a count of the items waiting to be
   * emitted.
   */
  get bufferLength() {
    return this[BUFFERLENGTH];
  }
  /**
   * The `BufferEncoding` currently in use, or `null`
   */
  get encoding() {
    return this[ENCODING];
  }
  /**
   * @deprecated - This is a read only property
   */
  set encoding(_enc) {
    throw new Error("Encoding must be set at instantiation time");
  }
  /**
   * @deprecated - Encoding may only be set at instantiation time
   */
  setEncoding(_enc) {
    throw new Error("Encoding must be set at instantiation time");
  }
  /**
   * True if this is an objectMode stream
   */
  get objectMode() {
    return this[OBJECTMODE];
  }
  /**
   * @deprecated - This is a read-only property
   */
  set objectMode(_om) {
    throw new Error("objectMode must be set at instantiation time");
  }
  /**
   * true if this is an async stream
   */
  get ["async"]() {
    return this[ASYNC];
  }
  /**
   * Set to true to make this stream async.
   *
   * Once set, it cannot be unset, as this would potentially cause incorrect
   * behavior.  Ie, a sync stream can be made async, but an async stream
   * cannot be safely made sync.
   */
  set ["async"](a) {
    this[ASYNC] = this[ASYNC] || !!a;
  }
  // drop everything and get out of the flow completely
  [ABORT]() {
    this[ABORTED] = true;
    this.emit("abort", this[SIGNAL]?.reason);
    this.destroy(this[SIGNAL]?.reason);
  }
  /**
   * True if the stream has been aborted.
   */
  get aborted() {
    return this[ABORTED];
  }
  /**
   * No-op setter. Stream aborted status is set via the AbortSignal provided
   * in the constructor options.
   */
  set aborted(_) {
  }
  write(chunk, encoding, cb) {
    if (this[ABORTED])
      return false;
    if (this[EOF])
      throw new Error("write after end");
    if (this[DESTROYED]) {
      this.emit("error", Object.assign(new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" }));
      return true;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }
    if (!encoding)
      encoding = "utf8";
    const fn = this[ASYNC] ? defer : nodefer;
    if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
      if (isArrayBufferView(chunk)) {
        chunk = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      } else if (isArrayBufferLike(chunk)) {
        chunk = Buffer.from(chunk);
      } else if (typeof chunk !== "string") {
        throw new Error("Non-contiguous data written to non-objectMode stream");
      }
    }
    if (this[OBJECTMODE]) {
      if (this[FLOWING] && this[BUFFERLENGTH] !== 0)
        this[FLUSH](true);
      if (this[FLOWING])
        this.emit("data", chunk);
      else
        this[BUFFERPUSH](chunk);
      if (this[BUFFERLENGTH] !== 0)
        this.emit("readable");
      if (cb)
        fn(cb);
      return this[FLOWING];
    }
    if (!chunk.length) {
      if (this[BUFFERLENGTH] !== 0)
        this.emit("readable");
      if (cb)
        fn(cb);
      return this[FLOWING];
    }
    if (typeof chunk === "string" && // unless it is a string already ready for us to use
    !(encoding === this[ENCODING] && !this[DECODER]?.lastNeed)) {
      chunk = Buffer.from(chunk, encoding);
    }
    if (Buffer.isBuffer(chunk) && this[ENCODING]) {
      chunk = this[DECODER].write(chunk);
    }
    if (this[FLOWING] && this[BUFFERLENGTH] !== 0)
      this[FLUSH](true);
    if (this[FLOWING])
      this.emit("data", chunk);
    else
      this[BUFFERPUSH](chunk);
    if (this[BUFFERLENGTH] !== 0)
      this.emit("readable");
    if (cb)
      fn(cb);
    return this[FLOWING];
  }
  /**
   * Low-level explicit read method.
   *
   * In objectMode, the argument is ignored, and one item is returned if
   * available.
   *
   * `n` is the number of bytes (or in the case of encoding streams,
   * characters) to consume. If `n` is not provided, then the entire buffer
   * is returned, or `null` is returned if no data is available.
   *
   * If `n` is greater that the amount of data in the internal buffer,
   * then `null` is returned.
   */
  read(n) {
    if (this[DESTROYED])
      return null;
    this[DISCARDED] = false;
    if (this[BUFFERLENGTH] === 0 || n === 0 || n && n > this[BUFFERLENGTH]) {
      this[MAYBE_EMIT_END]();
      return null;
    }
    if (this[OBJECTMODE])
      n = null;
    if (this[BUFFER].length > 1 && !this[OBJECTMODE]) {
      this[BUFFER] = [
        this[ENCODING] ? this[BUFFER].join("") : Buffer.concat(this[BUFFER], this[BUFFERLENGTH])
      ];
    }
    const ret = this[READ](n || null, this[BUFFER][0]);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [READ](n, chunk) {
    if (this[OBJECTMODE])
      this[BUFFERSHIFT]();
    else {
      const c = chunk;
      if (n === c.length || n === null)
        this[BUFFERSHIFT]();
      else if (typeof c === "string") {
        this[BUFFER][0] = c.slice(n);
        chunk = c.slice(0, n);
        this[BUFFERLENGTH] -= n;
      } else {
        this[BUFFER][0] = c.subarray(n);
        chunk = c.subarray(0, n);
        this[BUFFERLENGTH] -= n;
      }
    }
    this.emit("data", chunk);
    if (!this[BUFFER].length && !this[EOF])
      this.emit("drain");
    return chunk;
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = void 0;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }
    if (chunk !== void 0)
      this.write(chunk, encoding);
    if (cb)
      this.once("end", cb);
    this[EOF] = true;
    this.writable = false;
    if (this[FLOWING] || !this[PAUSED])
      this[MAYBE_EMIT_END]();
    return this;
  }
  // don't let the internal resume be overwritten
  [RESUME]() {
    if (this[DESTROYED])
      return;
    if (!this[DATALISTENERS] && !this[PIPES].length) {
      this[DISCARDED] = true;
    }
    this[PAUSED] = false;
    this[FLOWING] = true;
    this.emit("resume");
    if (this[BUFFER].length)
      this[FLUSH]();
    else if (this[EOF])
      this[MAYBE_EMIT_END]();
    else
      this.emit("drain");
  }
  /**
   * Resume the stream if it is currently in a paused state
   *
   * If called when there are no pipe destinations or `data` event listeners,
   * this will place the stream in a "discarded" state, where all data will
   * be thrown away. The discarded state is removed if a pipe destination or
   * data handler is added, if pause() is called, or if any synchronous or
   * asynchronous iteration is started.
   */
  resume() {
    return this[RESUME]();
  }
  /**
   * Pause the stream
   */
  pause() {
    this[FLOWING] = false;
    this[PAUSED] = true;
    this[DISCARDED] = false;
  }
  /**
   * true if the stream has been forcibly destroyed
   */
  get destroyed() {
    return this[DESTROYED];
  }
  /**
   * true if the stream is currently in a flowing state, meaning that
   * any writes will be immediately emitted.
   */
  get flowing() {
    return this[FLOWING];
  }
  /**
   * true if the stream is currently in a paused state
   */
  get paused() {
    return this[PAUSED];
  }
  [BUFFERPUSH](chunk) {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] += 1;
    else
      this[BUFFERLENGTH] += chunk.length;
    this[BUFFER].push(chunk);
  }
  [BUFFERSHIFT]() {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] -= 1;
    else
      this[BUFFERLENGTH] -= this[BUFFER][0].length;
    return this[BUFFER].shift();
  }
  [FLUSH](noDrain = false) {
    do {
    } while (this[FLUSHCHUNK](this[BUFFERSHIFT]()) && this[BUFFER].length);
    if (!noDrain && !this[BUFFER].length && !this[EOF])
      this.emit("drain");
  }
  [FLUSHCHUNK](chunk) {
    this.emit("data", chunk);
    return this[FLOWING];
  }
  /**
   * Pipe all data emitted by this stream into the destination provided.
   *
   * Triggers the flow of data.
   */
  pipe(dest, opts) {
    if (this[DESTROYED])
      return dest;
    this[DISCARDED] = false;
    const ended = this[EMITTED_END];
    opts = opts || {};
    if (dest === proc.stdout || dest === proc.stderr)
      opts.end = false;
    else
      opts.end = opts.end !== false;
    opts.proxyErrors = !!opts.proxyErrors;
    if (ended) {
      if (opts.end)
        dest.end();
    } else {
      this[PIPES].push(!opts.proxyErrors ? new Pipe(this, dest, opts) : new PipeProxyErrors(this, dest, opts));
      if (this[ASYNC])
        defer(() => this[RESUME]());
      else
        this[RESUME]();
    }
    return dest;
  }
  /**
   * Fully unhook a piped destination stream.
   *
   * If the destination stream was the only consumer of this stream (ie,
   * there are no other piped destinations or `'data'` event listeners)
   * then the flow of data will stop until there is another consumer or
   * {@link Minipass#resume} is explicitly called.
   */
  unpipe(dest) {
    const p = this[PIPES].find((p2) => p2.dest === dest);
    if (p) {
      if (this[PIPES].length === 1) {
        if (this[FLOWING] && this[DATALISTENERS] === 0) {
          this[FLOWING] = false;
        }
        this[PIPES] = [];
      } else
        this[PIPES].splice(this[PIPES].indexOf(p), 1);
      p.unpipe();
    }
  }
  /**
   * Alias for {@link Minipass#on}
   */
  addListener(ev, handler) {
    return this.on(ev, handler);
  }
  /**
   * Mostly identical to `EventEmitter.on`, with the following
   * behavior differences to prevent data loss and unnecessary hangs:
   *
   * - Adding a 'data' event handler will trigger the flow of data
   *
   * - Adding a 'readable' event handler when there is data waiting to be read
   *   will cause 'readable' to be emitted immediately.
   *
   * - Adding an 'endish' event handler ('end', 'finish', etc.) which has
   *   already passed will cause the event to be emitted immediately and all
   *   handlers removed.
   *
   * - Adding an 'error' event handler after an error has been emitted will
   *   cause the event to be re-emitted immediately with the error previously
   *   raised.
   */
  on(ev, handler) {
    const ret = super.on(ev, handler);
    if (ev === "data") {
      this[DISCARDED] = false;
      this[DATALISTENERS]++;
      if (!this[PIPES].length && !this[FLOWING]) {
        this[RESUME]();
      }
    } else if (ev === "readable" && this[BUFFERLENGTH] !== 0) {
      super.emit("readable");
    } else if (isEndish(ev) && this[EMITTED_END]) {
      super.emit(ev);
      this.removeAllListeners(ev);
    } else if (ev === "error" && this[EMITTED_ERROR]) {
      const h = handler;
      if (this[ASYNC])
        defer(() => h.call(this, this[EMITTED_ERROR]));
      else
        h.call(this, this[EMITTED_ERROR]);
    }
    return ret;
  }
  /**
   * Alias for {@link Minipass#off}
   */
  removeListener(ev, handler) {
    return this.off(ev, handler);
  }
  /**
   * Mostly identical to `EventEmitter.off`
   *
   * If a 'data' event handler is removed, and it was the last consumer
   * (ie, there are no pipe destinations or other 'data' event listeners),
   * then the flow of data will stop until there is another consumer or
   * {@link Minipass#resume} is explicitly called.
   */
  off(ev, handler) {
    const ret = super.off(ev, handler);
    if (ev === "data") {
      this[DATALISTENERS] = this.listeners("data").length;
      if (this[DATALISTENERS] === 0 && !this[DISCARDED] && !this[PIPES].length) {
        this[FLOWING] = false;
      }
    }
    return ret;
  }
  /**
   * Mostly identical to `EventEmitter.removeAllListeners`
   *
   * If all 'data' event handlers are removed, and they were the last consumer
   * (ie, there are no pipe destinations), then the flow of data will stop
   * until there is another consumer or {@link Minipass#resume} is explicitly
   * called.
   */
  removeAllListeners(ev) {
    const ret = super.removeAllListeners(ev);
    if (ev === "data" || ev === void 0) {
      this[DATALISTENERS] = 0;
      if (!this[DISCARDED] && !this[PIPES].length) {
        this[FLOWING] = false;
      }
    }
    return ret;
  }
  /**
   * true if the 'end' event has been emitted
   */
  get emittedEnd() {
    return this[EMITTED_END];
  }
  [MAYBE_EMIT_END]() {
    if (!this[EMITTING_END] && !this[EMITTED_END] && !this[DESTROYED] && this[BUFFER].length === 0 && this[EOF]) {
      this[EMITTING_END] = true;
      this.emit("end");
      this.emit("prefinish");
      this.emit("finish");
      if (this[CLOSED])
        this.emit("close");
      this[EMITTING_END] = false;
    }
  }
  /**
   * Mostly identical to `EventEmitter.emit`, with the following
   * behavior differences to prevent data loss and unnecessary hangs:
   *
   * If the stream has been destroyed, and the event is something other
   * than 'close' or 'error', then `false` is returned and no handlers
   * are called.
   *
   * If the event is 'end', and has already been emitted, then the event
   * is ignored. If the stream is in a paused or non-flowing state, then
   * the event will be deferred until data flow resumes. If the stream is
   * async, then handlers will be called on the next tick rather than
   * immediately.
   *
   * If the event is 'close', and 'end' has not yet been emitted, then
   * the event will be deferred until after 'end' is emitted.
   *
   * If the event is 'error', and an AbortSignal was provided for the stream,
   * and there are no listeners, then the event is ignored, matching the
   * behavior of node core streams in the presense of an AbortSignal.
   *
   * If the event is 'finish' or 'prefinish', then all listeners will be
   * removed after emitting the event, to prevent double-firing.
   */
  emit(ev, ...args) {
    const data = args[0];
    if (ev !== "error" && ev !== "close" && ev !== DESTROYED && this[DESTROYED]) {
      return false;
    } else if (ev === "data") {
      return !this[OBJECTMODE] && !data ? false : this[ASYNC] ? (defer(() => this[EMITDATA](data)), true) : this[EMITDATA](data);
    } else if (ev === "end") {
      return this[EMITEND]();
    } else if (ev === "close") {
      this[CLOSED] = true;
      if (!this[EMITTED_END] && !this[DESTROYED])
        return false;
      const ret2 = super.emit("close");
      this.removeAllListeners("close");
      return ret2;
    } else if (ev === "error") {
      this[EMITTED_ERROR] = data;
      super.emit(ERROR, data);
      const ret2 = !this[SIGNAL] || this.listeners("error").length ? super.emit("error", data) : false;
      this[MAYBE_EMIT_END]();
      return ret2;
    } else if (ev === "resume") {
      const ret2 = super.emit("resume");
      this[MAYBE_EMIT_END]();
      return ret2;
    } else if (ev === "finish" || ev === "prefinish") {
      const ret2 = super.emit(ev);
      this.removeAllListeners(ev);
      return ret2;
    }
    const ret = super.emit(ev, ...args);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [EMITDATA](data) {
    for (const p of this[PIPES]) {
      if (p.dest.write(data) === false)
        this.pause();
    }
    const ret = this[DISCARDED] ? false : super.emit("data", data);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [EMITEND]() {
    if (this[EMITTED_END])
      return false;
    this[EMITTED_END] = true;
    this.readable = false;
    return this[ASYNC] ? (defer(() => this[EMITEND2]()), true) : this[EMITEND2]();
  }
  [EMITEND2]() {
    if (this[DECODER]) {
      const data = this[DECODER].end();
      if (data) {
        for (const p of this[PIPES]) {
          p.dest.write(data);
        }
        if (!this[DISCARDED])
          super.emit("data", data);
      }
    }
    for (const p of this[PIPES]) {
      p.end();
    }
    const ret = super.emit("end");
    this.removeAllListeners("end");
    return ret;
  }
  /**
   * Return a Promise that resolves to an array of all emitted data once
   * the stream ends.
   */
  async collect() {
    const buf = Object.assign([], {
      dataLength: 0
    });
    if (!this[OBJECTMODE])
      buf.dataLength = 0;
    const p = this.promise();
    this.on("data", (c) => {
      buf.push(c);
      if (!this[OBJECTMODE])
        buf.dataLength += c.length;
    });
    await p;
    return buf;
  }
  /**
   * Return a Promise that resolves to the concatenation of all emitted data
   * once the stream ends.
   *
   * Not allowed on objectMode streams.
   */
  async concat() {
    if (this[OBJECTMODE]) {
      throw new Error("cannot concat in objectMode");
    }
    const buf = await this.collect();
    return this[ENCODING] ? buf.join("") : Buffer.concat(buf, buf.dataLength);
  }
  /**
   * Return a void Promise that resolves once the stream ends.
   */
  async promise() {
    return new Promise((resolve2, reject) => {
      this.on(DESTROYED, () => reject(new Error("stream destroyed")));
      this.on("error", (er) => reject(er));
      this.on("end", () => resolve2());
    });
  }
  /**
   * Asynchronous `for await of` iteration.
   *
   * This will continue emitting all chunks until the stream terminates.
   */
  [Symbol.asyncIterator]() {
    this[DISCARDED] = false;
    let stopped = false;
    const stop = async () => {
      this.pause();
      stopped = true;
      return { value: void 0, done: true };
    };
    const next = () => {
      if (stopped)
        return stop();
      const res = this.read();
      if (res !== null)
        return Promise.resolve({ done: false, value: res });
      if (this[EOF])
        return stop();
      let resolve2;
      let reject;
      const onerr = (er) => {
        this.off("data", ondata);
        this.off("end", onend);
        this.off(DESTROYED, ondestroy);
        stop();
        reject(er);
      };
      const ondata = (value) => {
        this.off("error", onerr);
        this.off("end", onend);
        this.off(DESTROYED, ondestroy);
        this.pause();
        resolve2({ value, done: !!this[EOF] });
      };
      const onend = () => {
        this.off("error", onerr);
        this.off("data", ondata);
        this.off(DESTROYED, ondestroy);
        stop();
        resolve2({ done: true, value: void 0 });
      };
      const ondestroy = () => onerr(new Error("stream destroyed"));
      return new Promise((res2, rej) => {
        reject = rej;
        resolve2 = res2;
        this.once(DESTROYED, ondestroy);
        this.once("error", onerr);
        this.once("end", onend);
        this.once("data", ondata);
      });
    };
    return {
      next,
      throw: stop,
      return: stop,
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
  /**
   * Synchronous `for of` iteration.
   *
   * The iteration will terminate when the internal buffer runs out, even
   * if the stream has not yet terminated.
   */
  [Symbol.iterator]() {
    this[DISCARDED] = false;
    let stopped = false;
    const stop = () => {
      this.pause();
      this.off(ERROR, stop);
      this.off(DESTROYED, stop);
      this.off("end", stop);
      stopped = true;
      return { done: true, value: void 0 };
    };
    const next = () => {
      if (stopped)
        return stop();
      const value = this.read();
      return value === null ? stop() : { done: false, value };
    };
    this.once("end", stop);
    this.once(ERROR, stop);
    this.once(DESTROYED, stop);
    return {
      next,
      throw: stop,
      return: stop,
      [Symbol.iterator]() {
        return this;
      }
    };
  }
  /**
   * Destroy a stream, preventing it from being used for any further purpose.
   *
   * If the stream has a `close()` method, then it will be called on
   * destruction.
   *
   * After destruction, any attempt to write data, read data, or emit most
   * events will be ignored.
   *
   * If an error argument is provided, then it will be emitted in an
   * 'error' event.
   */
  destroy(er) {
    if (this[DESTROYED]) {
      if (er)
        this.emit("error", er);
      else
        this.emit(DESTROYED);
      return this;
    }
    this[DESTROYED] = true;
    this[DISCARDED] = true;
    this[BUFFER].length = 0;
    this[BUFFERLENGTH] = 0;
    const wc = this;
    if (typeof wc.close === "function" && !this[CLOSED])
      wc.close();
    if (er)
      this.emit("error", er);
    else
      this.emit(DESTROYED);
    return this;
  }
  /**
   * Alias for {@link isStream}
   *
   * Former export location, maintained for backwards compatibility.
   *
   * @deprecated
   */
  static get isStream() {
    return isStream;
  }
};

// node_modules/@isaacs/fs-minipass/dist/esm/index.js
var writev = fs.writev;
var _autoClose = Symbol("_autoClose");
var _close = Symbol("_close");
var _ended = Symbol("_ended");
var _fd = Symbol("_fd");
var _finished = Symbol("_finished");
var _flags = Symbol("_flags");
var _flush = Symbol("_flush");
var _handleChunk = Symbol("_handleChunk");
var _makeBuf = Symbol("_makeBuf");
var _mode = Symbol("_mode");
var _needDrain = Symbol("_needDrain");
var _onerror = Symbol("_onerror");
var _onopen = Symbol("_onopen");
var _onread = Symbol("_onread");
var _onwrite = Symbol("_onwrite");
var _open = Symbol("_open");
var _path = Symbol("_path");
var _pos = Symbol("_pos");
var _queue = Symbol("_queue");
var _read = Symbol("_read");
var _readSize = Symbol("_readSize");
var _reading = Symbol("_reading");
var _remain = Symbol("_remain");
var _size = Symbol("_size");
var _write = Symbol("_write");
var _writing = Symbol("_writing");
var _defaultFlag = Symbol("_defaultFlag");
var _errored = Symbol("_errored");
var ReadStream = class extends Minipass {
  [_errored] = false;
  [_fd];
  [_path];
  [_readSize];
  [_reading] = false;
  [_size];
  [_remain];
  [_autoClose];
  constructor(path9, opt) {
    opt = opt || {};
    super(opt);
    this.readable = true;
    this.writable = false;
    if (typeof path9 !== "string") {
      throw new TypeError("path must be a string");
    }
    this[_errored] = false;
    this[_fd] = typeof opt.fd === "number" ? opt.fd : void 0;
    this[_path] = path9;
    this[_readSize] = opt.readSize || 16 * 1024 * 1024;
    this[_reading] = false;
    this[_size] = typeof opt.size === "number" ? opt.size : Infinity;
    this[_remain] = this[_size];
    this[_autoClose] = typeof opt.autoClose === "boolean" ? opt.autoClose : true;
    if (typeof this[_fd] === "number") {
      this[_read]();
    } else {
      this[_open]();
    }
  }
  get fd() {
    return this[_fd];
  }
  get path() {
    return this[_path];
  }
  //@ts-ignore
  write() {
    throw new TypeError("this is a readable stream");
  }
  //@ts-ignore
  end() {
    throw new TypeError("this is a readable stream");
  }
  [_open]() {
    fs.open(this[_path], "r", (er, fd2) => this[_onopen](er, fd2));
  }
  [_onopen](er, fd2) {
    if (er) {
      this[_onerror](er);
    } else {
      this[_fd] = fd2;
      this.emit("open", fd2);
      this[_read]();
    }
  }
  [_makeBuf]() {
    return Buffer.allocUnsafe(Math.min(this[_readSize], this[_remain]));
  }
  [_read]() {
    if (!this[_reading]) {
      this[_reading] = true;
      const buf = this[_makeBuf]();
      if (buf.length === 0) {
        return process.nextTick(() => this[_onread](null, 0, buf));
      }
      fs.read(this[_fd], buf, 0, buf.length, null, (er, br, b) => this[_onread](er, br, b));
    }
  }
  [_onread](er, br, buf) {
    this[_reading] = false;
    if (er) {
      this[_onerror](er);
    } else if (this[_handleChunk](br, buf)) {
      this[_read]();
    }
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd2 = this[_fd];
      this[_fd] = void 0;
      fs.close(fd2, (er) => er ? this.emit("error", er) : this.emit("close"));
    }
  }
  [_onerror](er) {
    this[_reading] = true;
    this[_close]();
    this.emit("error", er);
  }
  [_handleChunk](br, buf) {
    let ret = false;
    this[_remain] -= br;
    if (br > 0) {
      ret = super.write(br < buf.length ? buf.subarray(0, br) : buf);
    }
    if (br === 0 || this[_remain] <= 0) {
      ret = false;
      this[_close]();
      super.end();
    }
    return ret;
  }
  emit(ev, ...args) {
    switch (ev) {
      case "prefinish":
      case "finish":
        return false;
      case "drain":
        if (typeof this[_fd] === "number") {
          this[_read]();
        }
        return false;
      case "error":
        if (this[_errored]) {
          return false;
        }
        this[_errored] = true;
        return super.emit(ev, ...args);
      default:
        return super.emit(ev, ...args);
    }
  }
};
var ReadStreamSync = class extends ReadStream {
  [_open]() {
    let threw = true;
    try {
      this[_onopen](null, fs.openSync(this[_path], "r"));
      threw = false;
    } finally {
      if (threw) {
        this[_close]();
      }
    }
  }
  [_read]() {
    let threw = true;
    try {
      if (!this[_reading]) {
        this[_reading] = true;
        do {
          const buf = this[_makeBuf]();
          const br = buf.length === 0 ? 0 : fs.readSync(this[_fd], buf, 0, buf.length, null);
          if (!this[_handleChunk](br, buf)) {
            break;
          }
        } while (true);
        this[_reading] = false;
      }
      threw = false;
    } finally {
      if (threw) {
        this[_close]();
      }
    }
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd2 = this[_fd];
      this[_fd] = void 0;
      fs.closeSync(fd2);
      this.emit("close");
    }
  }
};
var WriteStream = class extends EE {
  readable = false;
  writable = true;
  [_errored] = false;
  [_writing] = false;
  [_ended] = false;
  [_queue] = [];
  [_needDrain] = false;
  [_path];
  [_mode];
  [_autoClose];
  [_fd];
  [_defaultFlag];
  [_flags];
  [_finished] = false;
  [_pos];
  constructor(path9, opt) {
    opt = opt || {};
    super(opt);
    this[_path] = path9;
    this[_fd] = typeof opt.fd === "number" ? opt.fd : void 0;
    this[_mode] = opt.mode === void 0 ? 438 : opt.mode;
    this[_pos] = typeof opt.start === "number" ? opt.start : void 0;
    this[_autoClose] = typeof opt.autoClose === "boolean" ? opt.autoClose : true;
    const defaultFlag = this[_pos] !== void 0 ? "r+" : "w";
    this[_defaultFlag] = opt.flags === void 0;
    this[_flags] = opt.flags === void 0 ? defaultFlag : opt.flags;
    if (this[_fd] === void 0) {
      this[_open]();
    }
  }
  emit(ev, ...args) {
    if (ev === "error") {
      if (this[_errored]) {
        return false;
      }
      this[_errored] = true;
    }
    return super.emit(ev, ...args);
  }
  get fd() {
    return this[_fd];
  }
  get path() {
    return this[_path];
  }
  [_onerror](er) {
    this[_close]();
    this[_writing] = true;
    this.emit("error", er);
  }
  [_open]() {
    fs.open(this[_path], this[_flags], this[_mode], (er, fd2) => this[_onopen](er, fd2));
  }
  [_onopen](er, fd2) {
    if (this[_defaultFlag] && this[_flags] === "r+" && er && er.code === "ENOENT") {
      this[_flags] = "w";
      this[_open]();
    } else if (er) {
      this[_onerror](er);
    } else {
      this[_fd] = fd2;
      this.emit("open", fd2);
      if (!this[_writing]) {
        this[_flush]();
      }
    }
  }
  end(buf, enc) {
    if (buf) {
      this.write(buf, enc);
    }
    this[_ended] = true;
    if (!this[_writing] && !this[_queue].length && typeof this[_fd] === "number") {
      this[_onwrite](null, 0);
    }
    return this;
  }
  write(buf, enc) {
    if (typeof buf === "string") {
      buf = Buffer.from(buf, enc);
    }
    if (this[_ended]) {
      this.emit("error", new Error("write() after end()"));
      return false;
    }
    if (this[_fd] === void 0 || this[_writing] || this[_queue].length) {
      this[_queue].push(buf);
      this[_needDrain] = true;
      return false;
    }
    this[_writing] = true;
    this[_write](buf);
    return true;
  }
  [_write](buf) {
    fs.write(this[_fd], buf, 0, buf.length, this[_pos], (er, bw) => this[_onwrite](er, bw));
  }
  [_onwrite](er, bw) {
    if (er) {
      this[_onerror](er);
    } else {
      if (this[_pos] !== void 0 && typeof bw === "number") {
        this[_pos] += bw;
      }
      if (this[_queue].length) {
        this[_flush]();
      } else {
        this[_writing] = false;
        if (this[_ended] && !this[_finished]) {
          this[_finished] = true;
          this[_close]();
          this.emit("finish");
        } else if (this[_needDrain]) {
          this[_needDrain] = false;
          this.emit("drain");
        }
      }
    }
  }
  [_flush]() {
    if (this[_queue].length === 0) {
      if (this[_ended]) {
        this[_onwrite](null, 0);
      }
    } else if (this[_queue].length === 1) {
      this[_write](this[_queue].pop());
    } else {
      const iovec = this[_queue];
      this[_queue] = [];
      writev(this[_fd], iovec, this[_pos], (er, bw) => this[_onwrite](er, bw));
    }
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd2 = this[_fd];
      this[_fd] = void 0;
      fs.close(fd2, (er) => er ? this.emit("error", er) : this.emit("close"));
    }
  }
};
var WriteStreamSync = class extends WriteStream {
  [_open]() {
    let fd2;
    if (this[_defaultFlag] && this[_flags] === "r+") {
      try {
        fd2 = fs.openSync(this[_path], this[_flags], this[_mode]);
      } catch (er) {
        if (er?.code === "ENOENT") {
          this[_flags] = "w";
          return this[_open]();
        } else {
          throw er;
        }
      }
    } else {
      fd2 = fs.openSync(this[_path], this[_flags], this[_mode]);
    }
    this[_onopen](null, fd2);
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd2 = this[_fd];
      this[_fd] = void 0;
      fs.closeSync(fd2);
      this.emit("close");
    }
  }
  [_write](buf) {
    let threw = true;
    try {
      this[_onwrite](null, fs.writeSync(this[_fd], buf, 0, buf.length, this[_pos]));
      threw = false;
    } finally {
      if (threw) {
        try {
          this[_close]();
        } catch {
        }
      }
    }
  }
};

// node_modules/tar/dist/esm/create.js
import path3 from "node:path";

// node_modules/tar/dist/esm/list.js
import fs2 from "node:fs";
import { dirname, parse as parse2 } from "path";

// node_modules/tar/dist/esm/options.js
var argmap = /* @__PURE__ */ new Map([
  ["C", "cwd"],
  ["f", "file"],
  ["z", "gzip"],
  ["P", "preservePaths"],
  ["U", "unlink"],
  ["strip-components", "strip"],
  ["stripComponents", "strip"],
  ["keep-newer", "newer"],
  ["keepNewer", "newer"],
  ["keep-newer-files", "newer"],
  ["keepNewerFiles", "newer"],
  ["k", "keep"],
  ["keep-existing", "keep"],
  ["keepExisting", "keep"],
  ["m", "noMtime"],
  ["no-mtime", "noMtime"],
  ["p", "preserveOwner"],
  ["L", "follow"],
  ["h", "follow"],
  ["onentry", "onReadEntry"]
]);
var isSyncFile = (o) => !!o.sync && !!o.file;
var isAsyncFile = (o) => !o.sync && !!o.file;
var isSyncNoFile = (o) => !!o.sync && !o.file;
var isAsyncNoFile = (o) => !o.sync && !o.file;
var isFile = (o) => !!o.file;
var dealiasKey = (k) => {
  const d = argmap.get(k);
  if (d)
    return d;
  return k;
};
var dealias = (opt = {}) => {
  if (!opt)
    return {};
  const result = {};
  for (const [key, v] of Object.entries(opt)) {
    const k = dealiasKey(key);
    result[k] = v;
  }
  if (result.chmod === void 0 && result.noChmod === false) {
    result.chmod = true;
  }
  delete result.noChmod;
  return result;
};

// node_modules/tar/dist/esm/make-command.js
var makeCommand = (syncFile, asyncFile, syncNoFile, asyncNoFile, validate) => {
  return Object.assign((opt_ = [], entries, cb) => {
    if (Array.isArray(opt_)) {
      entries = opt_;
      opt_ = {};
    }
    if (typeof entries === "function") {
      cb = entries;
      entries = void 0;
    }
    if (!entries) {
      entries = [];
    } else {
      entries = Array.from(entries);
    }
    const opt = dealias(opt_);
    validate?.(opt, entries);
    if (isSyncFile(opt)) {
      if (typeof cb === "function") {
        throw new TypeError("callback not supported for sync tar functions");
      }
      return syncFile(opt, entries);
    } else if (isAsyncFile(opt)) {
      const p = asyncFile(opt, entries);
      const c = cb ? cb : void 0;
      return c ? p.then(() => c(), c) : p;
    } else if (isSyncNoFile(opt)) {
      if (typeof cb === "function") {
        throw new TypeError("callback not supported for sync tar functions");
      }
      return syncNoFile(opt, entries);
    } else if (isAsyncNoFile(opt)) {
      if (typeof cb === "function") {
        throw new TypeError("callback only supported with file option");
      }
      return asyncNoFile(opt, entries);
    } else {
      throw new Error("impossible options??");
    }
  }, {
    syncFile,
    asyncFile,
    syncNoFile,
    asyncNoFile,
    validate
  });
};

// node_modules/tar/dist/esm/parse.js
import { EventEmitter as EE2 } from "events";

// node_modules/minizlib/dist/esm/index.js
import assert from "assert";
import { Buffer as Buffer2 } from "buffer";
import * as realZlib2 from "zlib";

// node_modules/minizlib/dist/esm/constants.js
import realZlib from "zlib";
var realZlibConstants = realZlib.constants || { ZLIB_VERNUM: 4736 };
var constants = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_VERSION_ERROR: -6,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  DEFLATE: 1,
  INFLATE: 2,
  GZIP: 3,
  GUNZIP: 4,
  DEFLATERAW: 5,
  INFLATERAW: 6,
  UNZIP: 7,
  BROTLI_DECODE: 8,
  BROTLI_ENCODE: 9,
  Z_MIN_WINDOWBITS: 8,
  Z_MAX_WINDOWBITS: 15,
  Z_DEFAULT_WINDOWBITS: 15,
  Z_MIN_CHUNK: 64,
  Z_MAX_CHUNK: Infinity,
  Z_DEFAULT_CHUNK: 16384,
  Z_MIN_MEMLEVEL: 1,
  Z_MAX_MEMLEVEL: 9,
  Z_DEFAULT_MEMLEVEL: 8,
  Z_MIN_LEVEL: -1,
  Z_MAX_LEVEL: 9,
  Z_DEFAULT_LEVEL: -1,
  BROTLI_OPERATION_PROCESS: 0,
  BROTLI_OPERATION_FLUSH: 1,
  BROTLI_OPERATION_FINISH: 2,
  BROTLI_OPERATION_EMIT_METADATA: 3,
  BROTLI_MODE_GENERIC: 0,
  BROTLI_MODE_TEXT: 1,
  BROTLI_MODE_FONT: 2,
  BROTLI_DEFAULT_MODE: 0,
  BROTLI_MIN_QUALITY: 0,
  BROTLI_MAX_QUALITY: 11,
  BROTLI_DEFAULT_QUALITY: 11,
  BROTLI_MIN_WINDOW_BITS: 10,
  BROTLI_MAX_WINDOW_BITS: 24,
  BROTLI_LARGE_MAX_WINDOW_BITS: 30,
  BROTLI_DEFAULT_WINDOW: 22,
  BROTLI_MIN_INPUT_BLOCK_BITS: 16,
  BROTLI_MAX_INPUT_BLOCK_BITS: 24,
  BROTLI_PARAM_MODE: 0,
  BROTLI_PARAM_QUALITY: 1,
  BROTLI_PARAM_LGWIN: 2,
  BROTLI_PARAM_LGBLOCK: 3,
  BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4,
  BROTLI_PARAM_SIZE_HINT: 5,
  BROTLI_PARAM_LARGE_WINDOW: 6,
  BROTLI_PARAM_NPOSTFIX: 7,
  BROTLI_PARAM_NDIRECT: 8,
  BROTLI_DECODER_RESULT_ERROR: 0,
  BROTLI_DECODER_RESULT_SUCCESS: 1,
  BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: 2,
  BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: 3,
  BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: 0,
  BROTLI_DECODER_PARAM_LARGE_WINDOW: 1,
  BROTLI_DECODER_NO_ERROR: 0,
  BROTLI_DECODER_SUCCESS: 1,
  BROTLI_DECODER_NEEDS_MORE_INPUT: 2,
  BROTLI_DECODER_NEEDS_MORE_OUTPUT: 3,
  BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: -1,
  BROTLI_DECODER_ERROR_FORMAT_RESERVED: -2,
  BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: -3,
  BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: -4,
  BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: -5,
  BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: -6,
  BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: -7,
  BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: -8,
  BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: -9,
  BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: -10,
  BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: -11,
  BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: -12,
  BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: -13,
  BROTLI_DECODER_ERROR_FORMAT_PADDING_1: -14,
  BROTLI_DECODER_ERROR_FORMAT_PADDING_2: -15,
  BROTLI_DECODER_ERROR_FORMAT_DISTANCE: -16,
  BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: -19,
  BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: -20,
  BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: -21,
  BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: -22,
  BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: -25,
  BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: -26,
  BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: -27,
  BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: -30,
  BROTLI_DECODER_ERROR_UNREACHABLE: -31
}, realZlibConstants));

// node_modules/minizlib/dist/esm/index.js
var OriginalBufferConcat = Buffer2.concat;
var desc = Object.getOwnPropertyDescriptor(Buffer2, "concat");
var noop = (args) => args;
var passthroughBufferConcat = desc?.writable === true || desc?.set !== void 0 ? (makeNoOp) => {
  Buffer2.concat = makeNoOp ? noop : OriginalBufferConcat;
} : (_) => {
};
var _superWrite = Symbol("_superWrite");
var ZlibError = class extends Error {
  code;
  errno;
  constructor(err2) {
    super("zlib: " + err2.message);
    this.code = err2.code;
    this.errno = err2.errno;
    if (!this.code)
      this.code = "ZLIB_ERROR";
    this.message = "zlib: " + err2.message;
    Error.captureStackTrace(this, this.constructor);
  }
  get name() {
    return "ZlibError";
  }
};
var _flushFlag = Symbol("flushFlag");
var ZlibBase = class extends Minipass {
  #sawError = false;
  #ended = false;
  #flushFlag;
  #finishFlushFlag;
  #fullFlushFlag;
  #handle;
  #onError;
  get sawError() {
    return this.#sawError;
  }
  get handle() {
    return this.#handle;
  }
  /* c8 ignore start */
  get flushFlag() {
    return this.#flushFlag;
  }
  /* c8 ignore stop */
  constructor(opts, mode) {
    if (!opts || typeof opts !== "object")
      throw new TypeError("invalid options for ZlibBase constructor");
    super(opts);
    this.#flushFlag = opts.flush ?? 0;
    this.#finishFlushFlag = opts.finishFlush ?? 0;
    this.#fullFlushFlag = opts.fullFlushFlag ?? 0;
    try {
      this.#handle = new realZlib2[mode](opts);
    } catch (er) {
      throw new ZlibError(er);
    }
    this.#onError = (err2) => {
      if (this.#sawError)
        return;
      this.#sawError = true;
      this.close();
      this.emit("error", err2);
    };
    this.#handle?.on("error", (er) => this.#onError(new ZlibError(er)));
    this.once("end", () => this.close);
  }
  close() {
    if (this.#handle) {
      this.#handle.close();
      this.#handle = void 0;
      this.emit("close");
    }
  }
  reset() {
    if (!this.#sawError) {
      assert(this.#handle, "zlib binding closed");
      return this.#handle.reset?.();
    }
  }
  flush(flushFlag) {
    if (this.ended)
      return;
    if (typeof flushFlag !== "number")
      flushFlag = this.#fullFlushFlag;
    this.write(Object.assign(Buffer2.alloc(0), { [_flushFlag]: flushFlag }));
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      encoding = void 0;
      chunk = void 0;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (chunk) {
      if (encoding)
        this.write(chunk, encoding);
      else
        this.write(chunk);
    }
    this.flush(this.#finishFlushFlag);
    this.#ended = true;
    return super.end(cb);
  }
  get ended() {
    return this.#ended;
  }
  // overridden in the gzip classes to do portable writes
  [_superWrite](data) {
    return super.write(data);
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function")
      cb = encoding, encoding = "utf8";
    if (typeof chunk === "string")
      chunk = Buffer2.from(chunk, encoding);
    if (this.#sawError)
      return;
    assert(this.#handle, "zlib binding closed");
    const nativeHandle = this.#handle._handle;
    const originalNativeClose = nativeHandle.close;
    nativeHandle.close = () => {
    };
    const originalClose = this.#handle.close;
    this.#handle.close = () => {
    };
    passthroughBufferConcat(true);
    let result = void 0;
    try {
      const flushFlag = typeof chunk[_flushFlag] === "number" ? chunk[_flushFlag] : this.#flushFlag;
      result = this.#handle._processChunk(chunk, flushFlag);
      passthroughBufferConcat(false);
    } catch (err2) {
      passthroughBufferConcat(false);
      this.#onError(new ZlibError(err2));
    } finally {
      if (this.#handle) {
        ;
        this.#handle._handle = nativeHandle;
        nativeHandle.close = originalNativeClose;
        this.#handle.close = originalClose;
        this.#handle.removeAllListeners("error");
      }
    }
    if (this.#handle)
      this.#handle.on("error", (er) => this.#onError(new ZlibError(er)));
    let writeReturn;
    if (result) {
      if (Array.isArray(result) && result.length > 0) {
        const r = result[0];
        writeReturn = this[_superWrite](Buffer2.from(r));
        for (let i = 1; i < result.length; i++) {
          writeReturn = this[_superWrite](result[i]);
        }
      } else {
        writeReturn = this[_superWrite](Buffer2.from(result));
      }
    }
    if (cb)
      cb();
    return writeReturn;
  }
};
var Zlib = class extends ZlibBase {
  #level;
  #strategy;
  constructor(opts, mode) {
    opts = opts || {};
    opts.flush = opts.flush || constants.Z_NO_FLUSH;
    opts.finishFlush = opts.finishFlush || constants.Z_FINISH;
    opts.fullFlushFlag = constants.Z_FULL_FLUSH;
    super(opts, mode);
    this.#level = opts.level;
    this.#strategy = opts.strategy;
  }
  params(level, strategy) {
    if (this.sawError)
      return;
    if (!this.handle)
      throw new Error("cannot switch params when binding is closed");
    if (!this.handle.params)
      throw new Error("not supported in this implementation");
    if (this.#level !== level || this.#strategy !== strategy) {
      this.flush(constants.Z_SYNC_FLUSH);
      assert(this.handle, "zlib binding closed");
      const origFlush = this.handle.flush;
      this.handle.flush = (flushFlag, cb) => {
        if (typeof flushFlag === "function") {
          cb = flushFlag;
          flushFlag = this.flushFlag;
        }
        this.flush(flushFlag);
        cb?.();
      };
      try {
        ;
        this.handle.params(level, strategy);
      } finally {
        this.handle.flush = origFlush;
      }
      if (this.handle) {
        this.#level = level;
        this.#strategy = strategy;
      }
    }
  }
};
var Gzip = class extends Zlib {
  #portable;
  constructor(opts) {
    super(opts, "Gzip");
    this.#portable = opts && !!opts.portable;
  }
  [_superWrite](data) {
    if (!this.#portable)
      return super[_superWrite](data);
    this.#portable = false;
    data[9] = 255;
    return super[_superWrite](data);
  }
};
var Unzip = class extends Zlib {
  constructor(opts) {
    super(opts, "Unzip");
  }
};
var Brotli = class extends ZlibBase {
  constructor(opts, mode) {
    opts = opts || {};
    opts.flush = opts.flush || constants.BROTLI_OPERATION_PROCESS;
    opts.finishFlush = opts.finishFlush || constants.BROTLI_OPERATION_FINISH;
    opts.fullFlushFlag = constants.BROTLI_OPERATION_FLUSH;
    super(opts, mode);
  }
};
var BrotliCompress = class extends Brotli {
  constructor(opts) {
    super(opts, "BrotliCompress");
  }
};
var BrotliDecompress = class extends Brotli {
  constructor(opts) {
    super(opts, "BrotliDecompress");
  }
};

// node_modules/yallist/dist/esm/index.js
var Yallist = class _Yallist {
  tail;
  head;
  length = 0;
  static create(list2 = []) {
    return new _Yallist(list2);
  }
  constructor(list2 = []) {
    for (const item of list2) {
      this.push(item);
    }
  }
  *[Symbol.iterator]() {
    for (let walker = this.head; walker; walker = walker.next) {
      yield walker.value;
    }
  }
  removeNode(node) {
    if (node.list !== this) {
      throw new Error("removing node which does not belong to this list");
    }
    const next = node.next;
    const prev = node.prev;
    if (next) {
      next.prev = prev;
    }
    if (prev) {
      prev.next = next;
    }
    if (node === this.head) {
      this.head = next;
    }
    if (node === this.tail) {
      this.tail = prev;
    }
    this.length--;
    node.next = void 0;
    node.prev = void 0;
    node.list = void 0;
    return next;
  }
  unshiftNode(node) {
    if (node === this.head) {
      return;
    }
    if (node.list) {
      node.list.removeNode(node);
    }
    const head = this.head;
    node.list = this;
    node.next = head;
    if (head) {
      head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
    this.length++;
  }
  pushNode(node) {
    if (node === this.tail) {
      return;
    }
    if (node.list) {
      node.list.removeNode(node);
    }
    const tail = this.tail;
    node.list = this;
    node.prev = tail;
    if (tail) {
      tail.next = node;
    }
    this.tail = node;
    if (!this.head) {
      this.head = node;
    }
    this.length++;
  }
  push(...args) {
    for (let i = 0, l = args.length; i < l; i++) {
      push(this, args[i]);
    }
    return this.length;
  }
  unshift(...args) {
    for (var i = 0, l = args.length; i < l; i++) {
      unshift(this, args[i]);
    }
    return this.length;
  }
  pop() {
    if (!this.tail) {
      return void 0;
    }
    const res = this.tail.value;
    const t = this.tail;
    this.tail = this.tail.prev;
    if (this.tail) {
      this.tail.next = void 0;
    } else {
      this.head = void 0;
    }
    t.list = void 0;
    this.length--;
    return res;
  }
  shift() {
    if (!this.head) {
      return void 0;
    }
    const res = this.head.value;
    const h = this.head;
    this.head = this.head.next;
    if (this.head) {
      this.head.prev = void 0;
    } else {
      this.tail = void 0;
    }
    h.list = void 0;
    this.length--;
    return res;
  }
  forEach(fn, thisp) {
    thisp = thisp || this;
    for (let walker = this.head, i = 0; !!walker; i++) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.next;
    }
  }
  forEachReverse(fn, thisp) {
    thisp = thisp || this;
    for (let walker = this.tail, i = this.length - 1; !!walker; i--) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.prev;
    }
  }
  get(n) {
    let i = 0;
    let walker = this.head;
    for (; !!walker && i < n; i++) {
      walker = walker.next;
    }
    if (i === n && !!walker) {
      return walker.value;
    }
  }
  getReverse(n) {
    let i = 0;
    let walker = this.tail;
    for (; !!walker && i < n; i++) {
      walker = walker.prev;
    }
    if (i === n && !!walker) {
      return walker.value;
    }
  }
  map(fn, thisp) {
    thisp = thisp || this;
    const res = new _Yallist();
    for (let walker = this.head; !!walker; ) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.next;
    }
    return res;
  }
  mapReverse(fn, thisp) {
    thisp = thisp || this;
    var res = new _Yallist();
    for (let walker = this.tail; !!walker; ) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.prev;
    }
    return res;
  }
  reduce(fn, initial) {
    let acc;
    let walker = this.head;
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.head) {
      walker = this.head.next;
      acc = this.head.value;
    } else {
      throw new TypeError("Reduce of empty list with no initial value");
    }
    for (var i = 0; !!walker; i++) {
      acc = fn(acc, walker.value, i);
      walker = walker.next;
    }
    return acc;
  }
  reduceReverse(fn, initial) {
    let acc;
    let walker = this.tail;
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.tail) {
      walker = this.tail.prev;
      acc = this.tail.value;
    } else {
      throw new TypeError("Reduce of empty list with no initial value");
    }
    for (let i = this.length - 1; !!walker; i--) {
      acc = fn(acc, walker.value, i);
      walker = walker.prev;
    }
    return acc;
  }
  toArray() {
    const arr = new Array(this.length);
    for (let i = 0, walker = this.head; !!walker; i++) {
      arr[i] = walker.value;
      walker = walker.next;
    }
    return arr;
  }
  toArrayReverse() {
    const arr = new Array(this.length);
    for (let i = 0, walker = this.tail; !!walker; i++) {
      arr[i] = walker.value;
      walker = walker.prev;
    }
    return arr;
  }
  slice(from = 0, to = this.length) {
    if (to < 0) {
      to += this.length;
    }
    if (from < 0) {
      from += this.length;
    }
    const ret = new _Yallist();
    if (to < from || to < 0) {
      return ret;
    }
    if (from < 0) {
      from = 0;
    }
    if (to > this.length) {
      to = this.length;
    }
    let walker = this.head;
    let i = 0;
    for (i = 0; !!walker && i < from; i++) {
      walker = walker.next;
    }
    for (; !!walker && i < to; i++, walker = walker.next) {
      ret.push(walker.value);
    }
    return ret;
  }
  sliceReverse(from = 0, to = this.length) {
    if (to < 0) {
      to += this.length;
    }
    if (from < 0) {
      from += this.length;
    }
    const ret = new _Yallist();
    if (to < from || to < 0) {
      return ret;
    }
    if (from < 0) {
      from = 0;
    }
    if (to > this.length) {
      to = this.length;
    }
    let i = this.length;
    let walker = this.tail;
    for (; !!walker && i > to; i--) {
      walker = walker.prev;
    }
    for (; !!walker && i > from; i--, walker = walker.prev) {
      ret.push(walker.value);
    }
    return ret;
  }
  splice(start, deleteCount = 0, ...nodes) {
    if (start > this.length) {
      start = this.length - 1;
    }
    if (start < 0) {
      start = this.length + start;
    }
    let walker = this.head;
    for (let i = 0; !!walker && i < start; i++) {
      walker = walker.next;
    }
    const ret = [];
    for (let i = 0; !!walker && i < deleteCount; i++) {
      ret.push(walker.value);
      walker = this.removeNode(walker);
    }
    if (!walker) {
      walker = this.tail;
    } else if (walker !== this.tail) {
      walker = walker.prev;
    }
    for (const v of nodes) {
      walker = insertAfter(this, walker, v);
    }
    return ret;
  }
  reverse() {
    const head = this.head;
    const tail = this.tail;
    for (let walker = head; !!walker; walker = walker.prev) {
      const p = walker.prev;
      walker.prev = walker.next;
      walker.next = p;
    }
    this.head = tail;
    this.tail = head;
    return this;
  }
};
function insertAfter(self2, node, value) {
  const prev = node;
  const next = node ? node.next : self2.head;
  const inserted = new Node(value, prev, next, self2);
  if (inserted.next === void 0) {
    self2.tail = inserted;
  }
  if (inserted.prev === void 0) {
    self2.head = inserted;
  }
  self2.length++;
  return inserted;
}
function push(self2, item) {
  self2.tail = new Node(item, self2.tail, void 0, self2);
  if (!self2.head) {
    self2.head = self2.tail;
  }
  self2.length++;
}
function unshift(self2, item) {
  self2.head = new Node(item, void 0, self2.head, self2);
  if (!self2.tail) {
    self2.tail = self2.head;
  }
  self2.length++;
}
var Node = class {
  list;
  next;
  prev;
  value;
  constructor(value, prev, next, list2) {
    this.list = list2;
    this.value = value;
    if (prev) {
      prev.next = this;
      this.prev = prev;
    } else {
      this.prev = void 0;
    }
    if (next) {
      next.prev = this;
      this.next = next;
    } else {
      this.next = void 0;
    }
  }
};

// node_modules/tar/dist/esm/header.js
import { posix as pathModule } from "node:path";

// node_modules/tar/dist/esm/large-numbers.js
var encode = (num, buf) => {
  if (!Number.isSafeInteger(num)) {
    throw Error("cannot encode number outside of javascript safe integer range");
  } else if (num < 0) {
    encodeNegative(num, buf);
  } else {
    encodePositive(num, buf);
  }
  return buf;
};
var encodePositive = (num, buf) => {
  buf[0] = 128;
  for (var i = buf.length; i > 1; i--) {
    buf[i - 1] = num & 255;
    num = Math.floor(num / 256);
  }
};
var encodeNegative = (num, buf) => {
  buf[0] = 255;
  var flipped = false;
  num = num * -1;
  for (var i = buf.length; i > 1; i--) {
    var byte = num & 255;
    num = Math.floor(num / 256);
    if (flipped) {
      buf[i - 1] = onesComp(byte);
    } else if (byte === 0) {
      buf[i - 1] = 0;
    } else {
      flipped = true;
      buf[i - 1] = twosComp(byte);
    }
  }
};
var parse = (buf) => {
  const pre = buf[0];
  const value = pre === 128 ? pos(buf.subarray(1, buf.length)) : pre === 255 ? twos(buf) : null;
  if (value === null) {
    throw Error("invalid base256 encoding");
  }
  if (!Number.isSafeInteger(value)) {
    throw Error("parsed number outside of javascript safe integer range");
  }
  return value;
};
var twos = (buf) => {
  var len = buf.length;
  var sum = 0;
  var flipped = false;
  for (var i = len - 1; i > -1; i--) {
    var byte = Number(buf[i]);
    var f2;
    if (flipped) {
      f2 = onesComp(byte);
    } else if (byte === 0) {
      f2 = byte;
    } else {
      flipped = true;
      f2 = twosComp(byte);
    }
    if (f2 !== 0) {
      sum -= f2 * Math.pow(256, len - i - 1);
    }
  }
  return sum;
};
var pos = (buf) => {
  var len = buf.length;
  var sum = 0;
  for (var i = len - 1; i > -1; i--) {
    var byte = Number(buf[i]);
    if (byte !== 0) {
      sum += byte * Math.pow(256, len - i - 1);
    }
  }
  return sum;
};
var onesComp = (byte) => (255 ^ byte) & 255;
var twosComp = (byte) => (255 ^ byte) + 1 & 255;

// node_modules/tar/dist/esm/types.js
var isCode = (c) => name.has(c);
var name = /* @__PURE__ */ new Map([
  ["0", "File"],
  // same as File
  ["", "OldFile"],
  ["1", "Link"],
  ["2", "SymbolicLink"],
  // Devices and FIFOs aren't fully supported
  // they are parsed, but skipped when unpacking
  ["3", "CharacterDevice"],
  ["4", "BlockDevice"],
  ["5", "Directory"],
  ["6", "FIFO"],
  // same as File
  ["7", "ContiguousFile"],
  // pax headers
  ["g", "GlobalExtendedHeader"],
  ["x", "ExtendedHeader"],
  // vendor-specific stuff
  // skip
  ["A", "SolarisACL"],
  // like 5, but with data, which should be skipped
  ["D", "GNUDumpDir"],
  // metadata only, skip
  ["I", "Inode"],
  // data = link path of next file
  ["K", "NextFileHasLongLinkpath"],
  // data = path of next file
  ["L", "NextFileHasLongPath"],
  // skip
  ["M", "ContinuationFile"],
  // like L
  ["N", "OldGnuLongPath"],
  // skip
  ["S", "SparseFile"],
  // skip
  ["V", "TapeVolumeHeader"],
  // like x
  ["X", "OldExtendedHeader"]
]);
var code = new Map(Array.from(name).map((kv) => [kv[1], kv[0]]));

// node_modules/tar/dist/esm/header.js
var Header = class {
  cksumValid = false;
  needPax = false;
  nullBlock = false;
  block;
  path;
  mode;
  uid;
  gid;
  size;
  cksum;
  #type = "Unsupported";
  linkpath;
  uname;
  gname;
  devmaj = 0;
  devmin = 0;
  atime;
  ctime;
  mtime;
  charset;
  comment;
  constructor(data, off = 0, ex, gex) {
    if (Buffer.isBuffer(data)) {
      this.decode(data, off || 0, ex, gex);
    } else if (data) {
      this.#slurp(data);
    }
  }
  decode(buf, off, ex, gex) {
    if (!off) {
      off = 0;
    }
    if (!buf || !(buf.length >= off + 512)) {
      throw new Error("need 512 bytes for header");
    }
    this.path = decString(buf, off, 100);
    this.mode = decNumber(buf, off + 100, 8);
    this.uid = decNumber(buf, off + 108, 8);
    this.gid = decNumber(buf, off + 116, 8);
    this.size = decNumber(buf, off + 124, 12);
    this.mtime = decDate(buf, off + 136, 12);
    this.cksum = decNumber(buf, off + 148, 12);
    if (gex)
      this.#slurp(gex, true);
    if (ex)
      this.#slurp(ex);
    const t = decString(buf, off + 156, 1);
    if (isCode(t)) {
      this.#type = t || "0";
    }
    if (this.#type === "0" && this.path.slice(-1) === "/") {
      this.#type = "5";
    }
    if (this.#type === "5") {
      this.size = 0;
    }
    this.linkpath = decString(buf, off + 157, 100);
    if (buf.subarray(off + 257, off + 265).toString() === "ustar\x0000") {
      this.uname = decString(buf, off + 265, 32);
      this.gname = decString(buf, off + 297, 32);
      this.devmaj = decNumber(buf, off + 329, 8) ?? 0;
      this.devmin = decNumber(buf, off + 337, 8) ?? 0;
      if (buf[off + 475] !== 0) {
        const prefix = decString(buf, off + 345, 155);
        this.path = prefix + "/" + this.path;
      } else {
        const prefix = decString(buf, off + 345, 130);
        if (prefix) {
          this.path = prefix + "/" + this.path;
        }
        this.atime = decDate(buf, off + 476, 12);
        this.ctime = decDate(buf, off + 488, 12);
      }
    }
    let sum = 8 * 32;
    for (let i = off; i < off + 148; i++) {
      sum += buf[i];
    }
    for (let i = off + 156; i < off + 512; i++) {
      sum += buf[i];
    }
    this.cksumValid = sum === this.cksum;
    if (this.cksum === void 0 && sum === 8 * 32) {
      this.nullBlock = true;
    }
  }
  #slurp(ex, gex = false) {
    Object.assign(this, Object.fromEntries(Object.entries(ex).filter(([k, v]) => {
      return !(v === null || v === void 0 || k === "path" && gex || k === "linkpath" && gex || k === "global");
    })));
  }
  encode(buf, off = 0) {
    if (!buf) {
      buf = this.block = Buffer.alloc(512);
    }
    if (this.#type === "Unsupported") {
      this.#type = "0";
    }
    if (!(buf.length >= off + 512)) {
      throw new Error("need 512 bytes for header");
    }
    const prefixSize = this.ctime || this.atime ? 130 : 155;
    const split2 = splitPrefix(this.path || "", prefixSize);
    const path9 = split2[0];
    const prefix = split2[1];
    this.needPax = !!split2[2];
    this.needPax = encString(buf, off, 100, path9) || this.needPax;
    this.needPax = encNumber(buf, off + 100, 8, this.mode) || this.needPax;
    this.needPax = encNumber(buf, off + 108, 8, this.uid) || this.needPax;
    this.needPax = encNumber(buf, off + 116, 8, this.gid) || this.needPax;
    this.needPax = encNumber(buf, off + 124, 12, this.size) || this.needPax;
    this.needPax = encDate(buf, off + 136, 12, this.mtime) || this.needPax;
    buf[off + 156] = this.#type.charCodeAt(0);
    this.needPax = encString(buf, off + 157, 100, this.linkpath) || this.needPax;
    buf.write("ustar\x0000", off + 257, 8);
    this.needPax = encString(buf, off + 265, 32, this.uname) || this.needPax;
    this.needPax = encString(buf, off + 297, 32, this.gname) || this.needPax;
    this.needPax = encNumber(buf, off + 329, 8, this.devmaj) || this.needPax;
    this.needPax = encNumber(buf, off + 337, 8, this.devmin) || this.needPax;
    this.needPax = encString(buf, off + 345, prefixSize, prefix) || this.needPax;
    if (buf[off + 475] !== 0) {
      this.needPax = encString(buf, off + 345, 155, prefix) || this.needPax;
    } else {
      this.needPax = encString(buf, off + 345, 130, prefix) || this.needPax;
      this.needPax = encDate(buf, off + 476, 12, this.atime) || this.needPax;
      this.needPax = encDate(buf, off + 488, 12, this.ctime) || this.needPax;
    }
    let sum = 8 * 32;
    for (let i = off; i < off + 148; i++) {
      sum += buf[i];
    }
    for (let i = off + 156; i < off + 512; i++) {
      sum += buf[i];
    }
    this.cksum = sum;
    encNumber(buf, off + 148, 8, this.cksum);
    this.cksumValid = true;
    return this.needPax;
  }
  get type() {
    return this.#type === "Unsupported" ? this.#type : name.get(this.#type);
  }
  get typeKey() {
    return this.#type;
  }
  set type(type) {
    const c = String(code.get(type));
    if (isCode(c) || c === "Unsupported") {
      this.#type = c;
    } else if (isCode(type)) {
      this.#type = type;
    } else {
      throw new TypeError("invalid entry type: " + type);
    }
  }
};
var splitPrefix = (p, prefixSize) => {
  const pathSize = 100;
  let pp = p;
  let prefix = "";
  let ret = void 0;
  const root = pathModule.parse(p).root || ".";
  if (Buffer.byteLength(pp) < pathSize) {
    ret = [pp, prefix, false];
  } else {
    prefix = pathModule.dirname(pp);
    pp = pathModule.basename(pp);
    do {
      if (Buffer.byteLength(pp) <= pathSize && Buffer.byteLength(prefix) <= prefixSize) {
        ret = [pp, prefix, false];
      } else if (Buffer.byteLength(pp) > pathSize && Buffer.byteLength(prefix) <= prefixSize) {
        ret = [pp.slice(0, pathSize - 1), prefix, true];
      } else {
        pp = pathModule.join(pathModule.basename(prefix), pp);
        prefix = pathModule.dirname(prefix);
      }
    } while (prefix !== root && ret === void 0);
    if (!ret) {
      ret = [p.slice(0, pathSize - 1), "", true];
    }
  }
  return ret;
};
var decString = (buf, off, size) => buf.subarray(off, off + size).toString("utf8").replace(/\0.*/, "");
var decDate = (buf, off, size) => numToDate(decNumber(buf, off, size));
var numToDate = (num) => num === void 0 ? void 0 : new Date(num * 1e3);
var decNumber = (buf, off, size) => Number(buf[off]) & 128 ? parse(buf.subarray(off, off + size)) : decSmallNumber(buf, off, size);
var nanUndef = (value) => isNaN(value) ? void 0 : value;
var decSmallNumber = (buf, off, size) => nanUndef(parseInt(buf.subarray(off, off + size).toString("utf8").replace(/\0.*$/, "").trim(), 8));
var MAXNUM = {
  12: 8589934591,
  8: 2097151
};
var encNumber = (buf, off, size, num) => num === void 0 ? false : num > MAXNUM[size] || num < 0 ? (encode(num, buf.subarray(off, off + size)), true) : (encSmallNumber(buf, off, size, num), false);
var encSmallNumber = (buf, off, size, num) => buf.write(octalString(num, size), off, size, "ascii");
var octalString = (num, size) => padOctal(Math.floor(num).toString(8), size);
var padOctal = (str, size) => (str.length === size - 1 ? str : new Array(size - str.length - 1).join("0") + str + " ") + "\0";
var encDate = (buf, off, size, date) => date === void 0 ? false : encNumber(buf, off, size, date.getTime() / 1e3);
var NULLS = new Array(156).join("\0");
var encString = (buf, off, size, str) => str === void 0 ? false : (buf.write(str + NULLS, off, size, "utf8"), str.length !== Buffer.byteLength(str) || str.length > size);

// node_modules/tar/dist/esm/pax.js
import { basename } from "node:path";
var Pax = class _Pax {
  atime;
  mtime;
  ctime;
  charset;
  comment;
  gid;
  uid;
  gname;
  uname;
  linkpath;
  dev;
  ino;
  nlink;
  path;
  size;
  mode;
  global;
  constructor(obj, global2 = false) {
    this.atime = obj.atime;
    this.charset = obj.charset;
    this.comment = obj.comment;
    this.ctime = obj.ctime;
    this.dev = obj.dev;
    this.gid = obj.gid;
    this.global = global2;
    this.gname = obj.gname;
    this.ino = obj.ino;
    this.linkpath = obj.linkpath;
    this.mtime = obj.mtime;
    this.nlink = obj.nlink;
    this.path = obj.path;
    this.size = obj.size;
    this.uid = obj.uid;
    this.uname = obj.uname;
  }
  encode() {
    const body = this.encodeBody();
    if (body === "") {
      return Buffer.allocUnsafe(0);
    }
    const bodyLen = Buffer.byteLength(body);
    const bufLen = 512 * Math.ceil(1 + bodyLen / 512);
    const buf = Buffer.allocUnsafe(bufLen);
    for (let i = 0; i < 512; i++) {
      buf[i] = 0;
    }
    new Header({
      // XXX split the path
      // then the path should be PaxHeader + basename, but less than 99,
      // prepend with the dirname
      /* c8 ignore start */
      path: ("PaxHeader/" + basename(this.path ?? "")).slice(0, 99),
      /* c8 ignore stop */
      mode: this.mode || 420,
      uid: this.uid,
      gid: this.gid,
      size: bodyLen,
      mtime: this.mtime,
      type: this.global ? "GlobalExtendedHeader" : "ExtendedHeader",
      linkpath: "",
      uname: this.uname || "",
      gname: this.gname || "",
      devmaj: 0,
      devmin: 0,
      atime: this.atime,
      ctime: this.ctime
    }).encode(buf);
    buf.write(body, 512, bodyLen, "utf8");
    for (let i = bodyLen + 512; i < buf.length; i++) {
      buf[i] = 0;
    }
    return buf;
  }
  encodeBody() {
    return this.encodeField("path") + this.encodeField("ctime") + this.encodeField("atime") + this.encodeField("dev") + this.encodeField("ino") + this.encodeField("nlink") + this.encodeField("charset") + this.encodeField("comment") + this.encodeField("gid") + this.encodeField("gname") + this.encodeField("linkpath") + this.encodeField("mtime") + this.encodeField("size") + this.encodeField("uid") + this.encodeField("uname");
  }
  encodeField(field) {
    if (this[field] === void 0) {
      return "";
    }
    const r = this[field];
    const v = r instanceof Date ? r.getTime() / 1e3 : r;
    const s = " " + (field === "dev" || field === "ino" || field === "nlink" ? "SCHILY." : "") + field + "=" + v + "\n";
    const byteLen = Buffer.byteLength(s);
    let digits = Math.floor(Math.log(byteLen) / Math.log(10)) + 1;
    if (byteLen + digits >= Math.pow(10, digits)) {
      digits += 1;
    }
    const len = digits + byteLen;
    return len + s;
  }
  static parse(str, ex, g = false) {
    return new _Pax(merge(parseKV(str), ex), g);
  }
};
var merge = (a, b) => b ? Object.assign({}, b, a) : a;
var parseKV = (str) => str.replace(/\n$/, "").split("\n").reduce(parseKVLine, /* @__PURE__ */ Object.create(null));
var parseKVLine = (set, line) => {
  const n = parseInt(line, 10);
  if (n !== Buffer.byteLength(line) + 1) {
    return set;
  }
  line = line.slice((n + " ").length);
  const kv = line.split("=");
  const r = kv.shift();
  if (!r) {
    return set;
  }
  const k = r.replace(/^SCHILY\.(dev|ino|nlink)/, "$1");
  const v = kv.join("=");
  set[k] = /^([A-Z]+\.)?([mac]|birth|creation)time$/.test(k) ? new Date(Number(v) * 1e3) : /^[0-9]+$/.test(v) ? +v : v;
  return set;
};

// node_modules/tar/dist/esm/normalize-windows-path.js
var platform = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var normalizeWindowsPath = platform !== "win32" ? (p) => p : (p) => p && p.replace(/\\/g, "/");

// node_modules/tar/dist/esm/read-entry.js
var ReadEntry = class extends Minipass {
  extended;
  globalExtended;
  header;
  startBlockSize;
  blockRemain;
  remain;
  type;
  meta = false;
  ignore = false;
  path;
  mode;
  uid;
  gid;
  uname;
  gname;
  size = 0;
  mtime;
  atime;
  ctime;
  linkpath;
  dev;
  ino;
  nlink;
  invalid = false;
  absolute;
  unsupported = false;
  constructor(header, ex, gex) {
    super({});
    this.pause();
    this.extended = ex;
    this.globalExtended = gex;
    this.header = header;
    this.remain = header.size ?? 0;
    this.startBlockSize = 512 * Math.ceil(this.remain / 512);
    this.blockRemain = this.startBlockSize;
    this.type = header.type;
    switch (this.type) {
      case "File":
      case "OldFile":
      case "Link":
      case "SymbolicLink":
      case "CharacterDevice":
      case "BlockDevice":
      case "Directory":
      case "FIFO":
      case "ContiguousFile":
      case "GNUDumpDir":
        break;
      case "NextFileHasLongLinkpath":
      case "NextFileHasLongPath":
      case "OldGnuLongPath":
      case "GlobalExtendedHeader":
      case "ExtendedHeader":
      case "OldExtendedHeader":
        this.meta = true;
        break;
      // NOTE: gnutar and bsdtar treat unrecognized types as 'File'
      // it may be worth doing the same, but with a warning.
      default:
        this.ignore = true;
    }
    if (!header.path) {
      throw new Error("no path provided for tar.ReadEntry");
    }
    this.path = normalizeWindowsPath(header.path);
    this.mode = header.mode;
    if (this.mode) {
      this.mode = this.mode & 4095;
    }
    this.uid = header.uid;
    this.gid = header.gid;
    this.uname = header.uname;
    this.gname = header.gname;
    this.size = this.remain;
    this.mtime = header.mtime;
    this.atime = header.atime;
    this.ctime = header.ctime;
    this.linkpath = header.linkpath ? normalizeWindowsPath(header.linkpath) : void 0;
    this.uname = header.uname;
    this.gname = header.gname;
    if (ex) {
      this.#slurp(ex);
    }
    if (gex) {
      this.#slurp(gex, true);
    }
  }
  write(data) {
    const writeLen = data.length;
    if (writeLen > this.blockRemain) {
      throw new Error("writing more to entry than is appropriate");
    }
    const r = this.remain;
    const br = this.blockRemain;
    this.remain = Math.max(0, r - writeLen);
    this.blockRemain = Math.max(0, br - writeLen);
    if (this.ignore) {
      return true;
    }
    if (r >= writeLen) {
      return super.write(data);
    }
    return super.write(data.subarray(0, r));
  }
  #slurp(ex, gex = false) {
    if (ex.path)
      ex.path = normalizeWindowsPath(ex.path);
    if (ex.linkpath)
      ex.linkpath = normalizeWindowsPath(ex.linkpath);
    Object.assign(this, Object.fromEntries(Object.entries(ex).filter(([k, v]) => {
      return !(v === null || v === void 0 || k === "path" && gex);
    })));
  }
};

// node_modules/tar/dist/esm/warn-method.js
var warnMethod = (self2, code2, message, data = {}) => {
  if (self2.file) {
    data.file = self2.file;
  }
  if (self2.cwd) {
    data.cwd = self2.cwd;
  }
  data.code = message instanceof Error && message.code || code2;
  data.tarCode = code2;
  if (!self2.strict && data.recoverable !== false) {
    if (message instanceof Error) {
      data = Object.assign(message, data);
      message = message.message;
    }
    self2.emit("warn", code2, message, data);
  } else if (message instanceof Error) {
    self2.emit("error", Object.assign(message, data));
  } else {
    self2.emit("error", Object.assign(new Error(`${code2}: ${message}`), data));
  }
};

// node_modules/tar/dist/esm/parse.js
var maxMetaEntrySize = 1024 * 1024;
var gzipHeader = Buffer.from([31, 139]);
var STATE = Symbol("state");
var WRITEENTRY = Symbol("writeEntry");
var READENTRY = Symbol("readEntry");
var NEXTENTRY = Symbol("nextEntry");
var PROCESSENTRY = Symbol("processEntry");
var EX = Symbol("extendedHeader");
var GEX = Symbol("globalExtendedHeader");
var META = Symbol("meta");
var EMITMETA = Symbol("emitMeta");
var BUFFER2 = Symbol("buffer");
var QUEUE = Symbol("queue");
var ENDED = Symbol("ended");
var EMITTEDEND = Symbol("emittedEnd");
var EMIT = Symbol("emit");
var UNZIP = Symbol("unzip");
var CONSUMECHUNK = Symbol("consumeChunk");
var CONSUMECHUNKSUB = Symbol("consumeChunkSub");
var CONSUMEBODY = Symbol("consumeBody");
var CONSUMEMETA = Symbol("consumeMeta");
var CONSUMEHEADER = Symbol("consumeHeader");
var CONSUMING = Symbol("consuming");
var BUFFERCONCAT = Symbol("bufferConcat");
var MAYBEEND = Symbol("maybeEnd");
var WRITING = Symbol("writing");
var ABORTED2 = Symbol("aborted");
var DONE = Symbol("onDone");
var SAW_VALID_ENTRY = Symbol("sawValidEntry");
var SAW_NULL_BLOCK = Symbol("sawNullBlock");
var SAW_EOF = Symbol("sawEOF");
var CLOSESTREAM = Symbol("closeStream");
var noop2 = () => true;
var Parser = class extends EE2 {
  file;
  strict;
  maxMetaEntrySize;
  filter;
  brotli;
  writable = true;
  readable = false;
  [QUEUE] = new Yallist();
  [BUFFER2];
  [READENTRY];
  [WRITEENTRY];
  [STATE] = "begin";
  [META] = "";
  [EX];
  [GEX];
  [ENDED] = false;
  [UNZIP];
  [ABORTED2] = false;
  [SAW_VALID_ENTRY];
  [SAW_NULL_BLOCK] = false;
  [SAW_EOF] = false;
  [WRITING] = false;
  [CONSUMING] = false;
  [EMITTEDEND] = false;
  constructor(opt = {}) {
    super();
    this.file = opt.file || "";
    this.on(DONE, () => {
      if (this[STATE] === "begin" || this[SAW_VALID_ENTRY] === false) {
        this.warn("TAR_BAD_ARCHIVE", "Unrecognized archive format");
      }
    });
    if (opt.ondone) {
      this.on(DONE, opt.ondone);
    } else {
      this.on(DONE, () => {
        this.emit("prefinish");
        this.emit("finish");
        this.emit("end");
      });
    }
    this.strict = !!opt.strict;
    this.maxMetaEntrySize = opt.maxMetaEntrySize || maxMetaEntrySize;
    this.filter = typeof opt.filter === "function" ? opt.filter : noop2;
    const isTBR = opt.file && (opt.file.endsWith(".tar.br") || opt.file.endsWith(".tbr"));
    this.brotli = !opt.gzip && opt.brotli !== void 0 ? opt.brotli : isTBR ? void 0 : false;
    this.on("end", () => this[CLOSESTREAM]());
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    if (typeof opt.onReadEntry === "function") {
      this.on("entry", opt.onReadEntry);
    }
  }
  warn(code2, message, data = {}) {
    warnMethod(this, code2, message, data);
  }
  [CONSUMEHEADER](chunk, position) {
    if (this[SAW_VALID_ENTRY] === void 0) {
      this[SAW_VALID_ENTRY] = false;
    }
    let header;
    try {
      header = new Header(chunk, position, this[EX], this[GEX]);
    } catch (er) {
      return this.warn("TAR_ENTRY_INVALID", er);
    }
    if (header.nullBlock) {
      if (this[SAW_NULL_BLOCK]) {
        this[SAW_EOF] = true;
        if (this[STATE] === "begin") {
          this[STATE] = "header";
        }
        this[EMIT]("eof");
      } else {
        this[SAW_NULL_BLOCK] = true;
        this[EMIT]("nullBlock");
      }
    } else {
      this[SAW_NULL_BLOCK] = false;
      if (!header.cksumValid) {
        this.warn("TAR_ENTRY_INVALID", "checksum failure", { header });
      } else if (!header.path) {
        this.warn("TAR_ENTRY_INVALID", "path is required", { header });
      } else {
        const type = header.type;
        if (/^(Symbolic)?Link$/.test(type) && !header.linkpath) {
          this.warn("TAR_ENTRY_INVALID", "linkpath required", {
            header
          });
        } else if (!/^(Symbolic)?Link$/.test(type) && !/^(Global)?ExtendedHeader$/.test(type) && header.linkpath) {
          this.warn("TAR_ENTRY_INVALID", "linkpath forbidden", {
            header
          });
        } else {
          const entry = this[WRITEENTRY] = new ReadEntry(header, this[EX], this[GEX]);
          if (!this[SAW_VALID_ENTRY]) {
            if (entry.remain) {
              const onend = () => {
                if (!entry.invalid) {
                  this[SAW_VALID_ENTRY] = true;
                }
              };
              entry.on("end", onend);
            } else {
              this[SAW_VALID_ENTRY] = true;
            }
          }
          if (entry.meta) {
            if (entry.size > this.maxMetaEntrySize) {
              entry.ignore = true;
              this[EMIT]("ignoredEntry", entry);
              this[STATE] = "ignore";
              entry.resume();
            } else if (entry.size > 0) {
              this[META] = "";
              entry.on("data", (c) => this[META] += c);
              this[STATE] = "meta";
            }
          } else {
            this[EX] = void 0;
            entry.ignore = entry.ignore || !this.filter(entry.path, entry);
            if (entry.ignore) {
              this[EMIT]("ignoredEntry", entry);
              this[STATE] = entry.remain ? "ignore" : "header";
              entry.resume();
            } else {
              if (entry.remain) {
                this[STATE] = "body";
              } else {
                this[STATE] = "header";
                entry.end();
              }
              if (!this[READENTRY]) {
                this[QUEUE].push(entry);
                this[NEXTENTRY]();
              } else {
                this[QUEUE].push(entry);
              }
            }
          }
        }
      }
    }
  }
  [CLOSESTREAM]() {
    queueMicrotask(() => this.emit("close"));
  }
  [PROCESSENTRY](entry) {
    let go = true;
    if (!entry) {
      this[READENTRY] = void 0;
      go = false;
    } else if (Array.isArray(entry)) {
      const [ev, ...args] = entry;
      this.emit(ev, ...args);
    } else {
      this[READENTRY] = entry;
      this.emit("entry", entry);
      if (!entry.emittedEnd) {
        entry.on("end", () => this[NEXTENTRY]());
        go = false;
      }
    }
    return go;
  }
  [NEXTENTRY]() {
    do {
    } while (this[PROCESSENTRY](this[QUEUE].shift()));
    if (!this[QUEUE].length) {
      const re = this[READENTRY];
      const drainNow = !re || re.flowing || re.size === re.remain;
      if (drainNow) {
        if (!this[WRITING]) {
          this.emit("drain");
        }
      } else {
        re.once("drain", () => this.emit("drain"));
      }
    }
  }
  [CONSUMEBODY](chunk, position) {
    const entry = this[WRITEENTRY];
    if (!entry) {
      throw new Error("attempt to consume body without entry??");
    }
    const br = entry.blockRemain ?? 0;
    const c = br >= chunk.length && position === 0 ? chunk : chunk.subarray(position, position + br);
    entry.write(c);
    if (!entry.blockRemain) {
      this[STATE] = "header";
      this[WRITEENTRY] = void 0;
      entry.end();
    }
    return c.length;
  }
  [CONSUMEMETA](chunk, position) {
    const entry = this[WRITEENTRY];
    const ret = this[CONSUMEBODY](chunk, position);
    if (!this[WRITEENTRY] && entry) {
      this[EMITMETA](entry);
    }
    return ret;
  }
  [EMIT](ev, data, extra) {
    if (!this[QUEUE].length && !this[READENTRY]) {
      this.emit(ev, data, extra);
    } else {
      this[QUEUE].push([ev, data, extra]);
    }
  }
  [EMITMETA](entry) {
    this[EMIT]("meta", this[META]);
    switch (entry.type) {
      case "ExtendedHeader":
      case "OldExtendedHeader":
        this[EX] = Pax.parse(this[META], this[EX], false);
        break;
      case "GlobalExtendedHeader":
        this[GEX] = Pax.parse(this[META], this[GEX], true);
        break;
      case "NextFileHasLongPath":
      case "OldGnuLongPath": {
        const ex = this[EX] ?? /* @__PURE__ */ Object.create(null);
        this[EX] = ex;
        ex.path = this[META].replace(/\0.*/, "");
        break;
      }
      case "NextFileHasLongLinkpath": {
        const ex = this[EX] || /* @__PURE__ */ Object.create(null);
        this[EX] = ex;
        ex.linkpath = this[META].replace(/\0.*/, "");
        break;
      }
      /* c8 ignore start */
      default:
        throw new Error("unknown meta: " + entry.type);
    }
  }
  abort(error) {
    this[ABORTED2] = true;
    this.emit("abort", error);
    this.warn("TAR_ABORT", error, { recoverable: false });
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(
        chunk,
        /* c8 ignore next */
        typeof encoding === "string" ? encoding : "utf8"
      );
    }
    if (this[ABORTED2]) {
      cb?.();
      return false;
    }
    const needSniff = this[UNZIP] === void 0 || this.brotli === void 0 && this[UNZIP] === false;
    if (needSniff && chunk) {
      if (this[BUFFER2]) {
        chunk = Buffer.concat([this[BUFFER2], chunk]);
        this[BUFFER2] = void 0;
      }
      if (chunk.length < gzipHeader.length) {
        this[BUFFER2] = chunk;
        cb?.();
        return true;
      }
      for (let i = 0; this[UNZIP] === void 0 && i < gzipHeader.length; i++) {
        if (chunk[i] !== gzipHeader[i]) {
          this[UNZIP] = false;
        }
      }
      const maybeBrotli = this.brotli === void 0;
      if (this[UNZIP] === false && maybeBrotli) {
        if (chunk.length < 512) {
          if (this[ENDED]) {
            this.brotli = true;
          } else {
            this[BUFFER2] = chunk;
            cb?.();
            return true;
          }
        } else {
          try {
            new Header(chunk.subarray(0, 512));
            this.brotli = false;
          } catch (_) {
            this.brotli = true;
          }
        }
      }
      if (this[UNZIP] === void 0 || this[UNZIP] === false && this.brotli) {
        const ended = this[ENDED];
        this[ENDED] = false;
        this[UNZIP] = this[UNZIP] === void 0 ? new Unzip({}) : new BrotliDecompress({});
        this[UNZIP].on("data", (chunk2) => this[CONSUMECHUNK](chunk2));
        this[UNZIP].on("error", (er) => this.abort(er));
        this[UNZIP].on("end", () => {
          this[ENDED] = true;
          this[CONSUMECHUNK]();
        });
        this[WRITING] = true;
        const ret2 = !!this[UNZIP][ended ? "end" : "write"](chunk);
        this[WRITING] = false;
        cb?.();
        return ret2;
      }
    }
    this[WRITING] = true;
    if (this[UNZIP]) {
      this[UNZIP].write(chunk);
    } else {
      this[CONSUMECHUNK](chunk);
    }
    this[WRITING] = false;
    const ret = this[QUEUE].length ? false : this[READENTRY] ? this[READENTRY].flowing : true;
    if (!ret && !this[QUEUE].length) {
      this[READENTRY]?.once("drain", () => this.emit("drain"));
    }
    cb?.();
    return ret;
  }
  [BUFFERCONCAT](c) {
    if (c && !this[ABORTED2]) {
      this[BUFFER2] = this[BUFFER2] ? Buffer.concat([this[BUFFER2], c]) : c;
    }
  }
  [MAYBEEND]() {
    if (this[ENDED] && !this[EMITTEDEND] && !this[ABORTED2] && !this[CONSUMING]) {
      this[EMITTEDEND] = true;
      const entry = this[WRITEENTRY];
      if (entry && entry.blockRemain) {
        const have = this[BUFFER2] ? this[BUFFER2].length : 0;
        this.warn("TAR_BAD_ARCHIVE", `Truncated input (needed ${entry.blockRemain} more bytes, only ${have} available)`, { entry });
        if (this[BUFFER2]) {
          entry.write(this[BUFFER2]);
        }
        entry.end();
      }
      this[EMIT](DONE);
    }
  }
  [CONSUMECHUNK](chunk) {
    if (this[CONSUMING] && chunk) {
      this[BUFFERCONCAT](chunk);
    } else if (!chunk && !this[BUFFER2]) {
      this[MAYBEEND]();
    } else if (chunk) {
      this[CONSUMING] = true;
      if (this[BUFFER2]) {
        this[BUFFERCONCAT](chunk);
        const c = this[BUFFER2];
        this[BUFFER2] = void 0;
        this[CONSUMECHUNKSUB](c);
      } else {
        this[CONSUMECHUNKSUB](chunk);
      }
      while (this[BUFFER2] && this[BUFFER2]?.length >= 512 && !this[ABORTED2] && !this[SAW_EOF]) {
        const c = this[BUFFER2];
        this[BUFFER2] = void 0;
        this[CONSUMECHUNKSUB](c);
      }
      this[CONSUMING] = false;
    }
    if (!this[BUFFER2] || this[ENDED]) {
      this[MAYBEEND]();
    }
  }
  [CONSUMECHUNKSUB](chunk) {
    let position = 0;
    const length = chunk.length;
    while (position + 512 <= length && !this[ABORTED2] && !this[SAW_EOF]) {
      switch (this[STATE]) {
        case "begin":
        case "header":
          this[CONSUMEHEADER](chunk, position);
          position += 512;
          break;
        case "ignore":
        case "body":
          position += this[CONSUMEBODY](chunk, position);
          break;
        case "meta":
          position += this[CONSUMEMETA](chunk, position);
          break;
        /* c8 ignore start */
        default:
          throw new Error("invalid state: " + this[STATE]);
      }
    }
    if (position < length) {
      if (this[BUFFER2]) {
        this[BUFFER2] = Buffer.concat([
          chunk.subarray(position),
          this[BUFFER2]
        ]);
      } else {
        this[BUFFER2] = chunk.subarray(position);
      }
    }
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      encoding = void 0;
      chunk = void 0;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding);
    }
    if (cb)
      this.once("finish", cb);
    if (!this[ABORTED2]) {
      if (this[UNZIP]) {
        if (chunk)
          this[UNZIP].write(chunk);
        this[UNZIP].end();
      } else {
        this[ENDED] = true;
        if (this.brotli === void 0)
          chunk = chunk || Buffer.alloc(0);
        if (chunk)
          this.write(chunk);
        this[MAYBEEND]();
      }
    }
    return this;
  }
};

// node_modules/tar/dist/esm/strip-trailing-slashes.js
var stripTrailingSlashes = (str) => {
  let i = str.length - 1;
  let slashesStart = -1;
  while (i > -1 && str.charAt(i) === "/") {
    slashesStart = i;
    i--;
  }
  return slashesStart === -1 ? str : str.slice(0, slashesStart);
};

// node_modules/tar/dist/esm/list.js
var onReadEntryFunction = (opt) => {
  const onReadEntry = opt.onReadEntry;
  opt.onReadEntry = onReadEntry ? (e) => {
    onReadEntry(e);
    e.resume();
  } : (e) => e.resume();
};
var filesFilter = (opt, files) => {
  const map = new Map(files.map((f2) => [stripTrailingSlashes(f2), true]));
  const filter = opt.filter;
  const mapHas = (file, r = "") => {
    const root = r || parse2(file).root || ".";
    let ret;
    if (file === root)
      ret = false;
    else {
      const m = map.get(file);
      if (m !== void 0) {
        ret = m;
      } else {
        ret = mapHas(dirname(file), root);
      }
    }
    map.set(file, ret);
    return ret;
  };
  opt.filter = filter ? (file, entry) => filter(file, entry) && mapHas(stripTrailingSlashes(file)) : (file) => mapHas(stripTrailingSlashes(file));
};
var listFileSync = (opt) => {
  const p = new Parser(opt);
  const file = opt.file;
  let fd2;
  try {
    const stat2 = fs2.statSync(file);
    const readSize = opt.maxReadSize || 16 * 1024 * 1024;
    if (stat2.size < readSize) {
      p.end(fs2.readFileSync(file));
    } else {
      let pos2 = 0;
      const buf = Buffer.allocUnsafe(readSize);
      fd2 = fs2.openSync(file, "r");
      while (pos2 < stat2.size) {
        const bytesRead = fs2.readSync(fd2, buf, 0, readSize, pos2);
        pos2 += bytesRead;
        p.write(buf.subarray(0, bytesRead));
      }
      p.end();
    }
  } finally {
    if (typeof fd2 === "number") {
      try {
        fs2.closeSync(fd2);
      } catch (er) {
      }
    }
  }
};
var listFile = (opt, _files) => {
  const parse6 = new Parser(opt);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const file = opt.file;
  const p = new Promise((resolve2, reject) => {
    parse6.on("error", reject);
    parse6.on("end", resolve2);
    fs2.stat(file, (er, stat2) => {
      if (er) {
        reject(er);
      } else {
        const stream2 = new ReadStream(file, {
          readSize,
          size: stat2.size
        });
        stream2.on("error", reject);
        stream2.pipe(parse6);
      }
    });
  });
  return p;
};
var list = makeCommand(listFileSync, listFile, (opt) => new Parser(opt), (opt) => new Parser(opt), (opt, files) => {
  if (files?.length)
    filesFilter(opt, files);
  if (!opt.noResume)
    onReadEntryFunction(opt);
});

// node_modules/tar/dist/esm/pack.js
import fs4 from "fs";

// node_modules/tar/dist/esm/write-entry.js
import fs3 from "fs";
import path from "path";

// node_modules/tar/dist/esm/mode-fix.js
var modeFix = (mode, isDir, portable) => {
  mode &= 4095;
  if (portable) {
    mode = (mode | 384) & ~18;
  }
  if (isDir) {
    if (mode & 256) {
      mode |= 64;
    }
    if (mode & 32) {
      mode |= 8;
    }
    if (mode & 4) {
      mode |= 1;
    }
  }
  return mode;
};

// node_modules/tar/dist/esm/strip-absolute-path.js
import { win32 } from "node:path";
var { isAbsolute, parse: parse3 } = win32;
var stripAbsolutePath = (path9) => {
  let r = "";
  let parsed = parse3(path9);
  while (isAbsolute(path9) || parsed.root) {
    const root = path9.charAt(0) === "/" && path9.slice(0, 4) !== "//?/" ? "/" : parsed.root;
    path9 = path9.slice(root.length);
    r += root;
    parsed = parse3(path9);
  }
  return [r, path9];
};

// node_modules/tar/dist/esm/winchars.js
var raw = ["|", "<", ">", "?", ":"];
var win = raw.map((char) => String.fromCharCode(61440 + char.charCodeAt(0)));
var toWin = new Map(raw.map((char, i) => [char, win[i]]));
var toRaw = new Map(win.map((char, i) => [char, raw[i]]));
var encode2 = (s) => raw.reduce((s2, c) => s2.split(c).join(toWin.get(c)), s);
var decode = (s) => win.reduce((s2, c) => s2.split(c).join(toRaw.get(c)), s);

// node_modules/tar/dist/esm/write-entry.js
var prefixPath = (path9, prefix) => {
  if (!prefix) {
    return normalizeWindowsPath(path9);
  }
  path9 = normalizeWindowsPath(path9).replace(/^\.(\/|$)/, "");
  return stripTrailingSlashes(prefix) + "/" + path9;
};
var maxReadSize = 16 * 1024 * 1024;
var PROCESS = Symbol("process");
var FILE = Symbol("file");
var DIRECTORY = Symbol("directory");
var SYMLINK = Symbol("symlink");
var HARDLINK = Symbol("hardlink");
var HEADER = Symbol("header");
var READ2 = Symbol("read");
var LSTAT = Symbol("lstat");
var ONLSTAT = Symbol("onlstat");
var ONREAD = Symbol("onread");
var ONREADLINK = Symbol("onreadlink");
var OPENFILE = Symbol("openfile");
var ONOPENFILE = Symbol("onopenfile");
var CLOSE = Symbol("close");
var MODE = Symbol("mode");
var AWAITDRAIN = Symbol("awaitDrain");
var ONDRAIN = Symbol("ondrain");
var PREFIX = Symbol("prefix");
var WriteEntry = class extends Minipass {
  path;
  portable;
  myuid = process.getuid && process.getuid() || 0;
  // until node has builtin pwnam functions, this'll have to do
  myuser = process.env.USER || "";
  maxReadSize;
  linkCache;
  statCache;
  preservePaths;
  cwd;
  strict;
  mtime;
  noPax;
  noMtime;
  prefix;
  fd;
  blockLen = 0;
  blockRemain = 0;
  buf;
  pos = 0;
  remain = 0;
  length = 0;
  offset = 0;
  win32;
  absolute;
  header;
  type;
  linkpath;
  stat;
  onWriteEntry;
  #hadError = false;
  constructor(p, opt_ = {}) {
    const opt = dealias(opt_);
    super();
    this.path = normalizeWindowsPath(p);
    this.portable = !!opt.portable;
    this.maxReadSize = opt.maxReadSize || maxReadSize;
    this.linkCache = opt.linkCache || /* @__PURE__ */ new Map();
    this.statCache = opt.statCache || /* @__PURE__ */ new Map();
    this.preservePaths = !!opt.preservePaths;
    this.cwd = normalizeWindowsPath(opt.cwd || process.cwd());
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.noMtime = !!opt.noMtime;
    this.mtime = opt.mtime;
    this.prefix = opt.prefix ? normalizeWindowsPath(opt.prefix) : void 0;
    this.onWriteEntry = opt.onWriteEntry;
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    let pathWarn = false;
    if (!this.preservePaths) {
      const [root, stripped] = stripAbsolutePath(this.path);
      if (root && typeof stripped === "string") {
        this.path = stripped;
        pathWarn = root;
      }
    }
    this.win32 = !!opt.win32 || process.platform === "win32";
    if (this.win32) {
      this.path = decode(this.path.replace(/\\/g, "/"));
      p = p.replace(/\\/g, "/");
    }
    this.absolute = normalizeWindowsPath(opt.absolute || path.resolve(this.cwd, p));
    if (this.path === "") {
      this.path = "./";
    }
    if (pathWarn) {
      this.warn("TAR_ENTRY_INFO", `stripping ${pathWarn} from absolute path`, {
        entry: this,
        path: pathWarn + this.path
      });
    }
    const cs = this.statCache.get(this.absolute);
    if (cs) {
      this[ONLSTAT](cs);
    } else {
      this[LSTAT]();
    }
  }
  warn(code2, message, data = {}) {
    return warnMethod(this, code2, message, data);
  }
  emit(ev, ...data) {
    if (ev === "error") {
      this.#hadError = true;
    }
    return super.emit(ev, ...data);
  }
  [LSTAT]() {
    fs3.lstat(this.absolute, (er, stat2) => {
      if (er) {
        return this.emit("error", er);
      }
      this[ONLSTAT](stat2);
    });
  }
  [ONLSTAT](stat2) {
    this.statCache.set(this.absolute, stat2);
    this.stat = stat2;
    if (!stat2.isFile()) {
      stat2.size = 0;
    }
    this.type = getType(stat2);
    this.emit("stat", stat2);
    this[PROCESS]();
  }
  [PROCESS]() {
    switch (this.type) {
      case "File":
        return this[FILE]();
      case "Directory":
        return this[DIRECTORY]();
      case "SymbolicLink":
        return this[SYMLINK]();
      // unsupported types are ignored.
      default:
        return this.end();
    }
  }
  [MODE](mode) {
    return modeFix(mode, this.type === "Directory", this.portable);
  }
  [PREFIX](path9) {
    return prefixPath(path9, this.prefix);
  }
  [HEADER]() {
    if (!this.stat) {
      throw new Error("cannot write header before stat");
    }
    if (this.type === "Directory" && this.portable) {
      this.noMtime = true;
    }
    this.onWriteEntry?.(this);
    this.header = new Header({
      path: this[PREFIX](this.path),
      // only apply the prefix to hard links.
      linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[PREFIX](this.linkpath) : this.linkpath,
      // only the permissions and setuid/setgid/sticky bitflags
      // not the higher-order bits that specify file type
      mode: this[MODE](this.stat.mode),
      uid: this.portable ? void 0 : this.stat.uid,
      gid: this.portable ? void 0 : this.stat.gid,
      size: this.stat.size,
      mtime: this.noMtime ? void 0 : this.mtime || this.stat.mtime,
      /* c8 ignore next */
      type: this.type === "Unsupported" ? void 0 : this.type,
      uname: this.portable ? void 0 : this.stat.uid === this.myuid ? this.myuser : "",
      atime: this.portable ? void 0 : this.stat.atime,
      ctime: this.portable ? void 0 : this.stat.ctime
    });
    if (this.header.encode() && !this.noPax) {
      super.write(new Pax({
        atime: this.portable ? void 0 : this.header.atime,
        ctime: this.portable ? void 0 : this.header.ctime,
        gid: this.portable ? void 0 : this.header.gid,
        mtime: this.noMtime ? void 0 : this.mtime || this.header.mtime,
        path: this[PREFIX](this.path),
        linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[PREFIX](this.linkpath) : this.linkpath,
        size: this.header.size,
        uid: this.portable ? void 0 : this.header.uid,
        uname: this.portable ? void 0 : this.header.uname,
        dev: this.portable ? void 0 : this.stat.dev,
        ino: this.portable ? void 0 : this.stat.ino,
        nlink: this.portable ? void 0 : this.stat.nlink
      }).encode());
    }
    const block = this.header?.block;
    if (!block) {
      throw new Error("failed to encode header");
    }
    super.write(block);
  }
  [DIRECTORY]() {
    if (!this.stat) {
      throw new Error("cannot create directory entry without stat");
    }
    if (this.path.slice(-1) !== "/") {
      this.path += "/";
    }
    this.stat.size = 0;
    this[HEADER]();
    this.end();
  }
  [SYMLINK]() {
    fs3.readlink(this.absolute, (er, linkpath) => {
      if (er) {
        return this.emit("error", er);
      }
      this[ONREADLINK](linkpath);
    });
  }
  [ONREADLINK](linkpath) {
    this.linkpath = normalizeWindowsPath(linkpath);
    this[HEADER]();
    this.end();
  }
  [HARDLINK](linkpath) {
    if (!this.stat) {
      throw new Error("cannot create link entry without stat");
    }
    this.type = "Link";
    this.linkpath = normalizeWindowsPath(path.relative(this.cwd, linkpath));
    this.stat.size = 0;
    this[HEADER]();
    this.end();
  }
  [FILE]() {
    if (!this.stat) {
      throw new Error("cannot create file entry without stat");
    }
    if (this.stat.nlink > 1) {
      const linkKey = `${this.stat.dev}:${this.stat.ino}`;
      const linkpath = this.linkCache.get(linkKey);
      if (linkpath?.indexOf(this.cwd) === 0) {
        return this[HARDLINK](linkpath);
      }
      this.linkCache.set(linkKey, this.absolute);
    }
    this[HEADER]();
    if (this.stat.size === 0) {
      return this.end();
    }
    this[OPENFILE]();
  }
  [OPENFILE]() {
    fs3.open(this.absolute, "r", (er, fd2) => {
      if (er) {
        return this.emit("error", er);
      }
      this[ONOPENFILE](fd2);
    });
  }
  [ONOPENFILE](fd2) {
    this.fd = fd2;
    if (this.#hadError) {
      return this[CLOSE]();
    }
    if (!this.stat) {
      throw new Error("should stat before calling onopenfile");
    }
    this.blockLen = 512 * Math.ceil(this.stat.size / 512);
    this.blockRemain = this.blockLen;
    const bufLen = Math.min(this.blockLen, this.maxReadSize);
    this.buf = Buffer.allocUnsafe(bufLen);
    this.offset = 0;
    this.pos = 0;
    this.remain = this.stat.size;
    this.length = this.buf.length;
    this[READ2]();
  }
  [READ2]() {
    const { fd: fd2, buf, offset, length, pos: pos2 } = this;
    if (fd2 === void 0 || buf === void 0) {
      throw new Error("cannot read file without first opening");
    }
    fs3.read(fd2, buf, offset, length, pos2, (er, bytesRead) => {
      if (er) {
        return this[CLOSE](() => this.emit("error", er));
      }
      this[ONREAD](bytesRead);
    });
  }
  /* c8 ignore start */
  [CLOSE](cb = () => {
  }) {
    if (this.fd !== void 0)
      fs3.close(this.fd, cb);
  }
  [ONREAD](bytesRead) {
    if (bytesRead <= 0 && this.remain > 0) {
      const er = Object.assign(new Error("encountered unexpected EOF"), {
        path: this.absolute,
        syscall: "read",
        code: "EOF"
      });
      return this[CLOSE](() => this.emit("error", er));
    }
    if (bytesRead > this.remain) {
      const er = Object.assign(new Error("did not encounter expected EOF"), {
        path: this.absolute,
        syscall: "read",
        code: "EOF"
      });
      return this[CLOSE](() => this.emit("error", er));
    }
    if (!this.buf) {
      throw new Error("should have created buffer prior to reading");
    }
    if (bytesRead === this.remain) {
      for (let i = bytesRead; i < this.length && bytesRead < this.blockRemain; i++) {
        this.buf[i + this.offset] = 0;
        bytesRead++;
        this.remain++;
      }
    }
    const chunk = this.offset === 0 && bytesRead === this.buf.length ? this.buf : this.buf.subarray(this.offset, this.offset + bytesRead);
    const flushed = this.write(chunk);
    if (!flushed) {
      this[AWAITDRAIN](() => this[ONDRAIN]());
    } else {
      this[ONDRAIN]();
    }
  }
  [AWAITDRAIN](cb) {
    this.once("drain", cb);
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
    }
    if (this.blockRemain < chunk.length) {
      const er = Object.assign(new Error("writing more data than expected"), {
        path: this.absolute
      });
      return this.emit("error", er);
    }
    this.remain -= chunk.length;
    this.blockRemain -= chunk.length;
    this.pos += chunk.length;
    this.offset += chunk.length;
    return super.write(chunk, null, cb);
  }
  [ONDRAIN]() {
    if (!this.remain) {
      if (this.blockRemain) {
        super.write(Buffer.alloc(this.blockRemain));
      }
      return this[CLOSE]((er) => er ? this.emit("error", er) : this.end());
    }
    if (!this.buf) {
      throw new Error("buffer lost somehow in ONDRAIN");
    }
    if (this.offset >= this.length) {
      this.buf = Buffer.allocUnsafe(Math.min(this.blockRemain, this.buf.length));
      this.offset = 0;
    }
    this.length = this.buf.length - this.offset;
    this[READ2]();
  }
};
var WriteEntrySync = class extends WriteEntry {
  sync = true;
  [LSTAT]() {
    this[ONLSTAT](fs3.lstatSync(this.absolute));
  }
  [SYMLINK]() {
    this[ONREADLINK](fs3.readlinkSync(this.absolute));
  }
  [OPENFILE]() {
    this[ONOPENFILE](fs3.openSync(this.absolute, "r"));
  }
  [READ2]() {
    let threw = true;
    try {
      const { fd: fd2, buf, offset, length, pos: pos2 } = this;
      if (fd2 === void 0 || buf === void 0) {
        throw new Error("fd and buf must be set in READ method");
      }
      const bytesRead = fs3.readSync(fd2, buf, offset, length, pos2);
      this[ONREAD](bytesRead);
      threw = false;
    } finally {
      if (threw) {
        try {
          this[CLOSE](() => {
          });
        } catch (er) {
        }
      }
    }
  }
  [AWAITDRAIN](cb) {
    cb();
  }
  /* c8 ignore start */
  [CLOSE](cb = () => {
  }) {
    if (this.fd !== void 0)
      fs3.closeSync(this.fd);
    cb();
  }
};
var WriteEntryTar = class extends Minipass {
  blockLen = 0;
  blockRemain = 0;
  buf = 0;
  pos = 0;
  remain = 0;
  length = 0;
  preservePaths;
  portable;
  strict;
  noPax;
  noMtime;
  readEntry;
  type;
  prefix;
  path;
  mode;
  uid;
  gid;
  uname;
  gname;
  header;
  mtime;
  atime;
  ctime;
  linkpath;
  size;
  onWriteEntry;
  warn(code2, message, data = {}) {
    return warnMethod(this, code2, message, data);
  }
  constructor(readEntry, opt_ = {}) {
    const opt = dealias(opt_);
    super();
    this.preservePaths = !!opt.preservePaths;
    this.portable = !!opt.portable;
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.noMtime = !!opt.noMtime;
    this.onWriteEntry = opt.onWriteEntry;
    this.readEntry = readEntry;
    const { type } = readEntry;
    if (type === "Unsupported") {
      throw new Error("writing entry that should be ignored");
    }
    this.type = type;
    if (this.type === "Directory" && this.portable) {
      this.noMtime = true;
    }
    this.prefix = opt.prefix;
    this.path = normalizeWindowsPath(readEntry.path);
    this.mode = readEntry.mode !== void 0 ? this[MODE](readEntry.mode) : void 0;
    this.uid = this.portable ? void 0 : readEntry.uid;
    this.gid = this.portable ? void 0 : readEntry.gid;
    this.uname = this.portable ? void 0 : readEntry.uname;
    this.gname = this.portable ? void 0 : readEntry.gname;
    this.size = readEntry.size;
    this.mtime = this.noMtime ? void 0 : opt.mtime || readEntry.mtime;
    this.atime = this.portable ? void 0 : readEntry.atime;
    this.ctime = this.portable ? void 0 : readEntry.ctime;
    this.linkpath = readEntry.linkpath !== void 0 ? normalizeWindowsPath(readEntry.linkpath) : void 0;
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    let pathWarn = false;
    if (!this.preservePaths) {
      const [root, stripped] = stripAbsolutePath(this.path);
      if (root && typeof stripped === "string") {
        this.path = stripped;
        pathWarn = root;
      }
    }
    this.remain = readEntry.size;
    this.blockRemain = readEntry.startBlockSize;
    this.onWriteEntry?.(this);
    this.header = new Header({
      path: this[PREFIX](this.path),
      linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[PREFIX](this.linkpath) : this.linkpath,
      // only the permissions and setuid/setgid/sticky bitflags
      // not the higher-order bits that specify file type
      mode: this.mode,
      uid: this.portable ? void 0 : this.uid,
      gid: this.portable ? void 0 : this.gid,
      size: this.size,
      mtime: this.noMtime ? void 0 : this.mtime,
      type: this.type,
      uname: this.portable ? void 0 : this.uname,
      atime: this.portable ? void 0 : this.atime,
      ctime: this.portable ? void 0 : this.ctime
    });
    if (pathWarn) {
      this.warn("TAR_ENTRY_INFO", `stripping ${pathWarn} from absolute path`, {
        entry: this,
        path: pathWarn + this.path
      });
    }
    if (this.header.encode() && !this.noPax) {
      super.write(new Pax({
        atime: this.portable ? void 0 : this.atime,
        ctime: this.portable ? void 0 : this.ctime,
        gid: this.portable ? void 0 : this.gid,
        mtime: this.noMtime ? void 0 : this.mtime,
        path: this[PREFIX](this.path),
        linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[PREFIX](this.linkpath) : this.linkpath,
        size: this.size,
        uid: this.portable ? void 0 : this.uid,
        uname: this.portable ? void 0 : this.uname,
        dev: this.portable ? void 0 : this.readEntry.dev,
        ino: this.portable ? void 0 : this.readEntry.ino,
        nlink: this.portable ? void 0 : this.readEntry.nlink
      }).encode());
    }
    const b = this.header?.block;
    if (!b)
      throw new Error("failed to encode header");
    super.write(b);
    readEntry.pipe(this);
  }
  [PREFIX](path9) {
    return prefixPath(path9, this.prefix);
  }
  [MODE](mode) {
    return modeFix(mode, this.type === "Directory", this.portable);
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
    }
    const writeLen = chunk.length;
    if (writeLen > this.blockRemain) {
      throw new Error("writing more to entry than is appropriate");
    }
    this.blockRemain -= writeLen;
    return super.write(chunk, cb);
  }
  end(chunk, encoding, cb) {
    if (this.blockRemain) {
      super.write(Buffer.alloc(this.blockRemain));
    }
    if (typeof chunk === "function") {
      cb = chunk;
      encoding = void 0;
      chunk = void 0;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding ?? "utf8");
    }
    if (cb)
      this.once("finish", cb);
    chunk ? super.end(chunk, cb) : super.end(cb);
    return this;
  }
};
var getType = (stat2) => stat2.isFile() ? "File" : stat2.isDirectory() ? "Directory" : stat2.isSymbolicLink() ? "SymbolicLink" : "Unsupported";

// node_modules/tar/dist/esm/pack.js
import path2 from "path";
var PackJob = class {
  path;
  absolute;
  entry;
  stat;
  readdir;
  pending = false;
  ignore = false;
  piped = false;
  constructor(path9, absolute) {
    this.path = path9 || "./";
    this.absolute = absolute;
  }
};
var EOF2 = Buffer.alloc(1024);
var ONSTAT = Symbol("onStat");
var ENDED2 = Symbol("ended");
var QUEUE2 = Symbol("queue");
var CURRENT = Symbol("current");
var PROCESS2 = Symbol("process");
var PROCESSING = Symbol("processing");
var PROCESSJOB = Symbol("processJob");
var JOBS = Symbol("jobs");
var JOBDONE = Symbol("jobDone");
var ADDFSENTRY = Symbol("addFSEntry");
var ADDTARENTRY = Symbol("addTarEntry");
var STAT = Symbol("stat");
var READDIR = Symbol("readdir");
var ONREADDIR = Symbol("onreaddir");
var PIPE = Symbol("pipe");
var ENTRY = Symbol("entry");
var ENTRYOPT = Symbol("entryOpt");
var WRITEENTRYCLASS = Symbol("writeEntryClass");
var WRITE = Symbol("write");
var ONDRAIN2 = Symbol("ondrain");
var Pack = class extends Minipass {
  opt;
  cwd;
  maxReadSize;
  preservePaths;
  strict;
  noPax;
  prefix;
  linkCache;
  statCache;
  file;
  portable;
  zip;
  readdirCache;
  noDirRecurse;
  follow;
  noMtime;
  mtime;
  filter;
  jobs;
  [WRITEENTRYCLASS];
  onWriteEntry;
  [QUEUE2];
  [JOBS] = 0;
  [PROCESSING] = false;
  [ENDED2] = false;
  constructor(opt = {}) {
    super();
    this.opt = opt;
    this.file = opt.file || "";
    this.cwd = opt.cwd || process.cwd();
    this.maxReadSize = opt.maxReadSize;
    this.preservePaths = !!opt.preservePaths;
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.prefix = normalizeWindowsPath(opt.prefix || "");
    this.linkCache = opt.linkCache || /* @__PURE__ */ new Map();
    this.statCache = opt.statCache || /* @__PURE__ */ new Map();
    this.readdirCache = opt.readdirCache || /* @__PURE__ */ new Map();
    this.onWriteEntry = opt.onWriteEntry;
    this[WRITEENTRYCLASS] = WriteEntry;
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    this.portable = !!opt.portable;
    if (opt.gzip || opt.brotli) {
      if (opt.gzip && opt.brotli) {
        throw new TypeError("gzip and brotli are mutually exclusive");
      }
      if (opt.gzip) {
        if (typeof opt.gzip !== "object") {
          opt.gzip = {};
        }
        if (this.portable) {
          opt.gzip.portable = true;
        }
        this.zip = new Gzip(opt.gzip);
      }
      if (opt.brotli) {
        if (typeof opt.brotli !== "object") {
          opt.brotli = {};
        }
        this.zip = new BrotliCompress(opt.brotli);
      }
      if (!this.zip)
        throw new Error("impossible");
      const zip = this.zip;
      zip.on("data", (chunk) => super.write(chunk));
      zip.on("end", () => super.end());
      zip.on("drain", () => this[ONDRAIN2]());
      this.on("resume", () => zip.resume());
    } else {
      this.on("drain", this[ONDRAIN2]);
    }
    this.noDirRecurse = !!opt.noDirRecurse;
    this.follow = !!opt.follow;
    this.noMtime = !!opt.noMtime;
    if (opt.mtime)
      this.mtime = opt.mtime;
    this.filter = typeof opt.filter === "function" ? opt.filter : () => true;
    this[QUEUE2] = new Yallist();
    this[JOBS] = 0;
    this.jobs = Number(opt.jobs) || 4;
    this[PROCESSING] = false;
    this[ENDED2] = false;
  }
  [WRITE](chunk) {
    return super.write(chunk);
  }
  add(path9) {
    this.write(path9);
    return this;
  }
  end(path9, encoding, cb) {
    if (typeof path9 === "function") {
      cb = path9;
      path9 = void 0;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = void 0;
    }
    if (path9) {
      this.add(path9);
    }
    this[ENDED2] = true;
    this[PROCESS2]();
    if (cb)
      cb();
    return this;
  }
  write(path9) {
    if (this[ENDED2]) {
      throw new Error("write after end");
    }
    if (path9 instanceof ReadEntry) {
      this[ADDTARENTRY](path9);
    } else {
      this[ADDFSENTRY](path9);
    }
    return this.flowing;
  }
  [ADDTARENTRY](p) {
    const absolute = normalizeWindowsPath(path2.resolve(this.cwd, p.path));
    if (!this.filter(p.path, p)) {
      p.resume();
    } else {
      const job = new PackJob(p.path, absolute);
      job.entry = new WriteEntryTar(p, this[ENTRYOPT](job));
      job.entry.on("end", () => this[JOBDONE](job));
      this[JOBS] += 1;
      this[QUEUE2].push(job);
    }
    this[PROCESS2]();
  }
  [ADDFSENTRY](p) {
    const absolute = normalizeWindowsPath(path2.resolve(this.cwd, p));
    this[QUEUE2].push(new PackJob(p, absolute));
    this[PROCESS2]();
  }
  [STAT](job) {
    job.pending = true;
    this[JOBS] += 1;
    const stat2 = this.follow ? "stat" : "lstat";
    fs4[stat2](job.absolute, (er, stat3) => {
      job.pending = false;
      this[JOBS] -= 1;
      if (er) {
        this.emit("error", er);
      } else {
        this[ONSTAT](job, stat3);
      }
    });
  }
  [ONSTAT](job, stat2) {
    this.statCache.set(job.absolute, stat2);
    job.stat = stat2;
    if (!this.filter(job.path, stat2)) {
      job.ignore = true;
    }
    this[PROCESS2]();
  }
  [READDIR](job) {
    job.pending = true;
    this[JOBS] += 1;
    fs4.readdir(job.absolute, (er, entries) => {
      job.pending = false;
      this[JOBS] -= 1;
      if (er) {
        return this.emit("error", er);
      }
      this[ONREADDIR](job, entries);
    });
  }
  [ONREADDIR](job, entries) {
    this.readdirCache.set(job.absolute, entries);
    job.readdir = entries;
    this[PROCESS2]();
  }
  [PROCESS2]() {
    if (this[PROCESSING]) {
      return;
    }
    this[PROCESSING] = true;
    for (let w = this[QUEUE2].head; !!w && this[JOBS] < this.jobs; w = w.next) {
      this[PROCESSJOB](w.value);
      if (w.value.ignore) {
        const p = w.next;
        this[QUEUE2].removeNode(w);
        w.next = p;
      }
    }
    this[PROCESSING] = false;
    if (this[ENDED2] && !this[QUEUE2].length && this[JOBS] === 0) {
      if (this.zip) {
        this.zip.end(EOF2);
      } else {
        super.write(EOF2);
        super.end();
      }
    }
  }
  get [CURRENT]() {
    return this[QUEUE2] && this[QUEUE2].head && this[QUEUE2].head.value;
  }
  [JOBDONE](_job) {
    this[QUEUE2].shift();
    this[JOBS] -= 1;
    this[PROCESS2]();
  }
  [PROCESSJOB](job) {
    if (job.pending) {
      return;
    }
    if (job.entry) {
      if (job === this[CURRENT] && !job.piped) {
        this[PIPE](job);
      }
      return;
    }
    if (!job.stat) {
      const sc = this.statCache.get(job.absolute);
      if (sc) {
        this[ONSTAT](job, sc);
      } else {
        this[STAT](job);
      }
    }
    if (!job.stat) {
      return;
    }
    if (job.ignore) {
      return;
    }
    if (!this.noDirRecurse && job.stat.isDirectory() && !job.readdir) {
      const rc = this.readdirCache.get(job.absolute);
      if (rc) {
        this[ONREADDIR](job, rc);
      } else {
        this[READDIR](job);
      }
      if (!job.readdir) {
        return;
      }
    }
    job.entry = this[ENTRY](job);
    if (!job.entry) {
      job.ignore = true;
      return;
    }
    if (job === this[CURRENT] && !job.piped) {
      this[PIPE](job);
    }
  }
  [ENTRYOPT](job) {
    return {
      onwarn: (code2, msg, data) => this.warn(code2, msg, data),
      noPax: this.noPax,
      cwd: this.cwd,
      absolute: job.absolute,
      preservePaths: this.preservePaths,
      maxReadSize: this.maxReadSize,
      strict: this.strict,
      portable: this.portable,
      linkCache: this.linkCache,
      statCache: this.statCache,
      noMtime: this.noMtime,
      mtime: this.mtime,
      prefix: this.prefix,
      onWriteEntry: this.onWriteEntry
    };
  }
  [ENTRY](job) {
    this[JOBS] += 1;
    try {
      const e = new this[WRITEENTRYCLASS](job.path, this[ENTRYOPT](job));
      return e.on("end", () => this[JOBDONE](job)).on("error", (er) => this.emit("error", er));
    } catch (er) {
      this.emit("error", er);
    }
  }
  [ONDRAIN2]() {
    if (this[CURRENT] && this[CURRENT].entry) {
      this[CURRENT].entry.resume();
    }
  }
  // like .pipe() but using super, because our write() is special
  [PIPE](job) {
    job.piped = true;
    if (job.readdir) {
      job.readdir.forEach((entry) => {
        const p = job.path;
        const base = p === "./" ? "" : p.replace(/\/*$/, "/");
        this[ADDFSENTRY](base + entry);
      });
    }
    const source = job.entry;
    const zip = this.zip;
    if (!source)
      throw new Error("cannot pipe without source");
    if (zip) {
      source.on("data", (chunk) => {
        if (!zip.write(chunk)) {
          source.pause();
        }
      });
    } else {
      source.on("data", (chunk) => {
        if (!super.write(chunk)) {
          source.pause();
        }
      });
    }
  }
  pause() {
    if (this.zip) {
      this.zip.pause();
    }
    return super.pause();
  }
  warn(code2, message, data = {}) {
    warnMethod(this, code2, message, data);
  }
};
var PackSync = class extends Pack {
  sync = true;
  constructor(opt) {
    super(opt);
    this[WRITEENTRYCLASS] = WriteEntrySync;
  }
  // pause/resume are no-ops in sync streams.
  pause() {
  }
  resume() {
  }
  [STAT](job) {
    const stat2 = this.follow ? "statSync" : "lstatSync";
    this[ONSTAT](job, fs4[stat2](job.absolute));
  }
  [READDIR](job) {
    this[ONREADDIR](job, fs4.readdirSync(job.absolute));
  }
  // gotta get it all in this tick
  [PIPE](job) {
    const source = job.entry;
    const zip = this.zip;
    if (job.readdir) {
      job.readdir.forEach((entry) => {
        const p = job.path;
        const base = p === "./" ? "" : p.replace(/\/*$/, "/");
        this[ADDFSENTRY](base + entry);
      });
    }
    if (!source)
      throw new Error("Cannot pipe without source");
    if (zip) {
      source.on("data", (chunk) => {
        zip.write(chunk);
      });
    } else {
      source.on("data", (chunk) => {
        super[WRITE](chunk);
      });
    }
  }
};

// node_modules/tar/dist/esm/create.js
var createFileSync = (opt, files) => {
  const p = new PackSync(opt);
  const stream2 = new WriteStreamSync(opt.file, {
    mode: opt.mode || 438
  });
  p.pipe(stream2);
  addFilesSync(p, files);
};
var createFile = (opt, files) => {
  const p = new Pack(opt);
  const stream2 = new WriteStream(opt.file, {
    mode: opt.mode || 438
  });
  p.pipe(stream2);
  const promise = new Promise((res, rej) => {
    stream2.on("error", rej);
    stream2.on("close", res);
    p.on("error", rej);
  });
  addFilesAsync(p, files);
  return promise;
};
var addFilesSync = (p, files) => {
  files.forEach((file) => {
    if (file.charAt(0) === "@") {
      list({
        file: path3.resolve(p.cwd, file.slice(1)),
        sync: true,
        noResume: true,
        onReadEntry: (entry) => p.add(entry)
      });
    } else {
      p.add(file);
    }
  });
  p.end();
};
var addFilesAsync = async (p, files) => {
  for (let i = 0; i < files.length; i++) {
    const file = String(files[i]);
    if (file.charAt(0) === "@") {
      await list({
        file: path3.resolve(String(p.cwd), file.slice(1)),
        noResume: true,
        onReadEntry: (entry) => {
          p.add(entry);
        }
      });
    } else {
      p.add(file);
    }
  }
  p.end();
};
var createSync = (opt, files) => {
  const p = new PackSync(opt);
  addFilesSync(p, files);
  return p;
};
var createAsync = (opt, files) => {
  const p = new Pack(opt);
  addFilesAsync(p, files);
  return p;
};
var create = makeCommand(createFileSync, createFile, createSync, createAsync, (_opt, files) => {
  if (!files?.length) {
    throw new TypeError("no paths specified to add to archive");
  }
});

// node_modules/tar/dist/esm/extract.js
import fs9 from "node:fs";

// node_modules/tar/dist/esm/unpack.js
import assert2 from "node:assert";
import { randomBytes } from "node:crypto";
import fs8 from "node:fs";
import path6 from "node:path";

// node_modules/tar/dist/esm/get-write-flag.js
import fs5 from "fs";
var platform2 = process.env.__FAKE_PLATFORM__ || process.platform;
var isWindows = platform2 === "win32";
var { O_CREAT, O_TRUNC, O_WRONLY } = fs5.constants;
var UV_FS_O_FILEMAP = Number(process.env.__FAKE_FS_O_FILENAME__) || fs5.constants.UV_FS_O_FILEMAP || 0;
var fMapEnabled = isWindows && !!UV_FS_O_FILEMAP;
var fMapLimit = 512 * 1024;
var fMapFlag = UV_FS_O_FILEMAP | O_TRUNC | O_CREAT | O_WRONLY;
var getWriteFlag = !fMapEnabled ? () => "w" : (size) => size < fMapLimit ? fMapFlag : "w";

// node_modules/chownr/dist/esm/index.js
import fs6 from "node:fs";
import path4 from "node:path";
var lchownSync = (path9, uid, gid) => {
  try {
    return fs6.lchownSync(path9, uid, gid);
  } catch (er) {
    if (er?.code !== "ENOENT")
      throw er;
  }
};
var chown = (cpath, uid, gid, cb) => {
  fs6.lchown(cpath, uid, gid, (er) => {
    cb(er && er?.code !== "ENOENT" ? er : null);
  });
};
var chownrKid = (p, child, uid, gid, cb) => {
  if (child.isDirectory()) {
    chownr(path4.resolve(p, child.name), uid, gid, (er) => {
      if (er)
        return cb(er);
      const cpath = path4.resolve(p, child.name);
      chown(cpath, uid, gid, cb);
    });
  } else {
    const cpath = path4.resolve(p, child.name);
    chown(cpath, uid, gid, cb);
  }
};
var chownr = (p, uid, gid, cb) => {
  fs6.readdir(p, { withFileTypes: true }, (er, children) => {
    if (er) {
      if (er.code === "ENOENT")
        return cb();
      else if (er.code !== "ENOTDIR" && er.code !== "ENOTSUP")
        return cb(er);
    }
    if (er || !children.length)
      return chown(p, uid, gid, cb);
    let len = children.length;
    let errState = null;
    const then = (er2) => {
      if (errState)
        return;
      if (er2)
        return cb(errState = er2);
      if (--len === 0)
        return chown(p, uid, gid, cb);
    };
    for (const child of children) {
      chownrKid(p, child, uid, gid, then);
    }
  });
};
var chownrKidSync = (p, child, uid, gid) => {
  if (child.isDirectory())
    chownrSync(path4.resolve(p, child.name), uid, gid);
  lchownSync(path4.resolve(p, child.name), uid, gid);
};
var chownrSync = (p, uid, gid) => {
  let children;
  try {
    children = fs6.readdirSync(p, { withFileTypes: true });
  } catch (er) {
    const e = er;
    if (e?.code === "ENOENT")
      return;
    else if (e?.code === "ENOTDIR" || e?.code === "ENOTSUP")
      return lchownSync(p, uid, gid);
    else
      throw e;
  }
  for (const child of children) {
    chownrKidSync(p, child, uid, gid);
  }
  return lchownSync(p, uid, gid);
};

// node_modules/tar/dist/esm/mkdir.js
import fs7 from "fs";

// node_modules/mkdirp/dist/mjs/mkdirp-manual.js
import { dirname as dirname2 } from "path";

// node_modules/mkdirp/dist/mjs/opts-arg.js
import { mkdir, mkdirSync, stat, statSync } from "fs";
var optsArg = (opts) => {
  if (!opts) {
    opts = { mode: 511 };
  } else if (typeof opts === "object") {
    opts = { mode: 511, ...opts };
  } else if (typeof opts === "number") {
    opts = { mode: opts };
  } else if (typeof opts === "string") {
    opts = { mode: parseInt(opts, 8) };
  } else {
    throw new TypeError("invalid options argument");
  }
  const resolved = opts;
  const optsFs = opts.fs || {};
  opts.mkdir = opts.mkdir || optsFs.mkdir || mkdir;
  opts.mkdirAsync = opts.mkdirAsync ? opts.mkdirAsync : async (path9, options) => {
    return new Promise((res, rej) => resolved.mkdir(path9, options, (er, made) => er ? rej(er) : res(made)));
  };
  opts.stat = opts.stat || optsFs.stat || stat;
  opts.statAsync = opts.statAsync ? opts.statAsync : async (path9) => new Promise((res, rej) => resolved.stat(path9, (err2, stats) => err2 ? rej(err2) : res(stats)));
  opts.statSync = opts.statSync || optsFs.statSync || statSync;
  opts.mkdirSync = opts.mkdirSync || optsFs.mkdirSync || mkdirSync;
  return resolved;
};

// node_modules/mkdirp/dist/mjs/mkdirp-manual.js
var mkdirpManualSync = (path9, options, made) => {
  const parent = dirname2(path9);
  const opts = { ...optsArg(options), recursive: false };
  if (parent === path9) {
    try {
      return opts.mkdirSync(path9, opts);
    } catch (er) {
      const fer = er;
      if (fer && fer.code !== "EISDIR") {
        throw er;
      }
      return;
    }
  }
  try {
    opts.mkdirSync(path9, opts);
    return made || path9;
  } catch (er) {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManualSync(path9, opts, mkdirpManualSync(parent, opts, made));
    }
    if (fer && fer.code !== "EEXIST" && fer && fer.code !== "EROFS") {
      throw er;
    }
    try {
      if (!opts.statSync(path9).isDirectory())
        throw er;
    } catch (_) {
      throw er;
    }
  }
};
var mkdirpManual = Object.assign(async (path9, options, made) => {
  const opts = optsArg(options);
  opts.recursive = false;
  const parent = dirname2(path9);
  if (parent === path9) {
    return opts.mkdirAsync(path9, opts).catch((er) => {
      const fer = er;
      if (fer && fer.code !== "EISDIR") {
        throw er;
      }
    });
  }
  return opts.mkdirAsync(path9, opts).then(() => made || path9, async (er) => {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManual(parent, opts).then((made2) => mkdirpManual(path9, opts, made2));
    }
    if (fer && fer.code !== "EEXIST" && fer.code !== "EROFS") {
      throw er;
    }
    return opts.statAsync(path9).then((st) => {
      if (st.isDirectory()) {
        return made;
      } else {
        throw er;
      }
    }, () => {
      throw er;
    });
  });
}, { sync: mkdirpManualSync });

// node_modules/mkdirp/dist/mjs/mkdirp-native.js
import { dirname as dirname4 } from "path";

// node_modules/mkdirp/dist/mjs/find-made.js
import { dirname as dirname3 } from "path";
var findMade = async (opts, parent, path9) => {
  if (path9 === parent) {
    return;
  }
  return opts.statAsync(parent).then(
    (st) => st.isDirectory() ? path9 : void 0,
    // will fail later
    // will fail later
    (er) => {
      const fer = er;
      return fer && fer.code === "ENOENT" ? findMade(opts, dirname3(parent), parent) : void 0;
    }
  );
};
var findMadeSync = (opts, parent, path9) => {
  if (path9 === parent) {
    return void 0;
  }
  try {
    return opts.statSync(parent).isDirectory() ? path9 : void 0;
  } catch (er) {
    const fer = er;
    return fer && fer.code === "ENOENT" ? findMadeSync(opts, dirname3(parent), parent) : void 0;
  }
};

// node_modules/mkdirp/dist/mjs/mkdirp-native.js
var mkdirpNativeSync = (path9, options) => {
  const opts = optsArg(options);
  opts.recursive = true;
  const parent = dirname4(path9);
  if (parent === path9) {
    return opts.mkdirSync(path9, opts);
  }
  const made = findMadeSync(opts, path9);
  try {
    opts.mkdirSync(path9, opts);
    return made;
  } catch (er) {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManualSync(path9, opts);
    } else {
      throw er;
    }
  }
};
var mkdirpNative = Object.assign(async (path9, options) => {
  const opts = { ...optsArg(options), recursive: true };
  const parent = dirname4(path9);
  if (parent === path9) {
    return await opts.mkdirAsync(path9, opts);
  }
  return findMade(opts, path9).then((made) => opts.mkdirAsync(path9, opts).then((m) => made || m).catch((er) => {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManual(path9, opts);
    } else {
      throw er;
    }
  }));
}, { sync: mkdirpNativeSync });

// node_modules/mkdirp/dist/mjs/path-arg.js
import { parse as parse4, resolve } from "path";
var platform3 = process.env.__TESTING_MKDIRP_PLATFORM__ || process.platform;
var pathArg = (path9) => {
  if (/\0/.test(path9)) {
    throw Object.assign(new TypeError("path must be a string without null bytes"), {
      path: path9,
      code: "ERR_INVALID_ARG_VALUE"
    });
  }
  path9 = resolve(path9);
  if (platform3 === "win32") {
    const badWinChars = /[*|"<>?:]/;
    const { root } = parse4(path9);
    if (badWinChars.test(path9.substring(root.length))) {
      throw Object.assign(new Error("Illegal characters in path."), {
        path: path9,
        code: "EINVAL"
      });
    }
  }
  return path9;
};

// node_modules/mkdirp/dist/mjs/use-native.js
import { mkdir as mkdir2, mkdirSync as mkdirSync2 } from "fs";
var version = process.env.__TESTING_MKDIRP_NODE_VERSION__ || process.version;
var versArr = version.replace(/^v/, "").split(".");
var hasNative = +versArr[0] > 10 || +versArr[0] === 10 && +versArr[1] >= 12;
var useNativeSync = !hasNative ? () => false : (opts) => optsArg(opts).mkdirSync === mkdirSync2;
var useNative = Object.assign(!hasNative ? () => false : (opts) => optsArg(opts).mkdir === mkdir2, {
  sync: useNativeSync
});

// node_modules/mkdirp/dist/mjs/index.js
var mkdirpSync = (path9, opts) => {
  path9 = pathArg(path9);
  const resolved = optsArg(opts);
  return useNativeSync(resolved) ? mkdirpNativeSync(path9, resolved) : mkdirpManualSync(path9, resolved);
};
var mkdirp = Object.assign(async (path9, opts) => {
  path9 = pathArg(path9);
  const resolved = optsArg(opts);
  return useNative(resolved) ? mkdirpNative(path9, resolved) : mkdirpManual(path9, resolved);
}, {
  mkdirpSync,
  mkdirpNative,
  mkdirpNativeSync,
  mkdirpManual,
  mkdirpManualSync,
  sync: mkdirpSync,
  native: mkdirpNative,
  nativeSync: mkdirpNativeSync,
  manual: mkdirpManual,
  manualSync: mkdirpManualSync,
  useNative,
  useNativeSync
});

// node_modules/tar/dist/esm/mkdir.js
import path5 from "node:path";

// node_modules/tar/dist/esm/cwd-error.js
var CwdError = class extends Error {
  path;
  code;
  syscall = "chdir";
  constructor(path9, code2) {
    super(`${code2}: Cannot cd into '${path9}'`);
    this.path = path9;
    this.code = code2;
  }
  get name() {
    return "CwdError";
  }
};

// node_modules/tar/dist/esm/symlink-error.js
var SymlinkError = class extends Error {
  path;
  symlink;
  syscall = "symlink";
  code = "TAR_SYMLINK_ERROR";
  constructor(symlink, path9) {
    super("TAR_SYMLINK_ERROR: Cannot extract through symbolic link");
    this.symlink = symlink;
    this.path = path9;
  }
  get name() {
    return "SymlinkError";
  }
};

// node_modules/tar/dist/esm/mkdir.js
var cGet = (cache, key) => cache.get(normalizeWindowsPath(key));
var cSet = (cache, key, val) => cache.set(normalizeWindowsPath(key), val);
var checkCwd = (dir, cb) => {
  fs7.stat(dir, (er, st) => {
    if (er || !st.isDirectory()) {
      er = new CwdError(dir, er?.code || "ENOTDIR");
    }
    cb(er);
  });
};
var mkdir3 = (dir, opt, cb) => {
  dir = normalizeWindowsPath(dir);
  const umask = opt.umask ?? 18;
  const mode = opt.mode | 448;
  const needChmod = (mode & umask) !== 0;
  const uid = opt.uid;
  const gid = opt.gid;
  const doChown = typeof uid === "number" && typeof gid === "number" && (uid !== opt.processUid || gid !== opt.processGid);
  const preserve = opt.preserve;
  const unlink = opt.unlink;
  const cache = opt.cache;
  const cwd = normalizeWindowsPath(opt.cwd);
  const done = (er, created) => {
    if (er) {
      cb(er);
    } else {
      cSet(cache, dir, true);
      if (created && doChown) {
        chownr(created, uid, gid, (er2) => done(er2));
      } else if (needChmod) {
        fs7.chmod(dir, mode, cb);
      } else {
        cb();
      }
    }
  };
  if (cache && cGet(cache, dir) === true) {
    return done();
  }
  if (dir === cwd) {
    return checkCwd(dir, done);
  }
  if (preserve) {
    return mkdirp(dir, { mode }).then(
      (made) => done(null, made ?? void 0),
      // oh, ts
      done
    );
  }
  const sub = normalizeWindowsPath(path5.relative(cwd, dir));
  const parts = sub.split("/");
  mkdir_(cwd, parts, mode, cache, unlink, cwd, void 0, done);
};
var mkdir_ = (base, parts, mode, cache, unlink, cwd, created, cb) => {
  if (!parts.length) {
    return cb(null, created);
  }
  const p = parts.shift();
  const part = normalizeWindowsPath(path5.resolve(base + "/" + p));
  if (cGet(cache, part)) {
    return mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
  }
  fs7.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb));
};
var onmkdir = (part, parts, mode, cache, unlink, cwd, created, cb) => (er) => {
  if (er) {
    fs7.lstat(part, (statEr, st) => {
      if (statEr) {
        statEr.path = statEr.path && normalizeWindowsPath(statEr.path);
        cb(statEr);
      } else if (st.isDirectory()) {
        mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
      } else if (unlink) {
        fs7.unlink(part, (er2) => {
          if (er2) {
            return cb(er2);
          }
          fs7.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb));
        });
      } else if (st.isSymbolicLink()) {
        return cb(new SymlinkError(part, part + "/" + parts.join("/")));
      } else {
        cb(er);
      }
    });
  } else {
    created = created || part;
    mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
  }
};
var checkCwdSync = (dir) => {
  let ok = false;
  let code2 = void 0;
  try {
    ok = fs7.statSync(dir).isDirectory();
  } catch (er) {
    code2 = er?.code;
  } finally {
    if (!ok) {
      throw new CwdError(dir, code2 ?? "ENOTDIR");
    }
  }
};
var mkdirSync3 = (dir, opt) => {
  dir = normalizeWindowsPath(dir);
  const umask = opt.umask ?? 18;
  const mode = opt.mode | 448;
  const needChmod = (mode & umask) !== 0;
  const uid = opt.uid;
  const gid = opt.gid;
  const doChown = typeof uid === "number" && typeof gid === "number" && (uid !== opt.processUid || gid !== opt.processGid);
  const preserve = opt.preserve;
  const unlink = opt.unlink;
  const cache = opt.cache;
  const cwd = normalizeWindowsPath(opt.cwd);
  const done = (created2) => {
    cSet(cache, dir, true);
    if (created2 && doChown) {
      chownrSync(created2, uid, gid);
    }
    if (needChmod) {
      fs7.chmodSync(dir, mode);
    }
  };
  if (cache && cGet(cache, dir) === true) {
    return done();
  }
  if (dir === cwd) {
    checkCwdSync(cwd);
    return done();
  }
  if (preserve) {
    return done(mkdirpSync(dir, mode) ?? void 0);
  }
  const sub = normalizeWindowsPath(path5.relative(cwd, dir));
  const parts = sub.split("/");
  let created = void 0;
  for (let p = parts.shift(), part = cwd; p && (part += "/" + p); p = parts.shift()) {
    part = normalizeWindowsPath(path5.resolve(part));
    if (cGet(cache, part)) {
      continue;
    }
    try {
      fs7.mkdirSync(part, mode);
      created = created || part;
      cSet(cache, part, true);
    } catch (er) {
      const st = fs7.lstatSync(part);
      if (st.isDirectory()) {
        cSet(cache, part, true);
        continue;
      } else if (unlink) {
        fs7.unlinkSync(part);
        fs7.mkdirSync(part, mode);
        created = created || part;
        cSet(cache, part, true);
        continue;
      } else if (st.isSymbolicLink()) {
        return new SymlinkError(part, part + "/" + parts.join("/"));
      }
    }
  }
  return done(created);
};

// node_modules/tar/dist/esm/normalize-unicode.js
var normalizeCache = /* @__PURE__ */ Object.create(null);
var { hasOwnProperty } = Object.prototype;
var normalizeUnicode = (s) => {
  if (!hasOwnProperty.call(normalizeCache, s)) {
    normalizeCache[s] = s.normalize("NFD");
  }
  return normalizeCache[s];
};

// node_modules/tar/dist/esm/path-reservations.js
import { join } from "node:path";
var platform4 = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var isWindows2 = platform4 === "win32";
var getDirs = (path9) => {
  const dirs = path9.split("/").slice(0, -1).reduce((set, path10) => {
    const s = set[set.length - 1];
    if (s !== void 0) {
      path10 = join(s, path10);
    }
    set.push(path10 || "/");
    return set;
  }, []);
  return dirs;
};
var PathReservations = class {
  // path => [function or Set]
  // A Set object means a directory reservation
  // A fn is a direct reservation on that path
  #queues = /* @__PURE__ */ new Map();
  // fn => {paths:[path,...], dirs:[path, ...]}
  #reservations = /* @__PURE__ */ new Map();
  // functions currently running
  #running = /* @__PURE__ */ new Set();
  reserve(paths, fn) {
    paths = isWindows2 ? ["win32 parallelization disabled"] : paths.map((p) => {
      return stripTrailingSlashes(join(normalizeUnicode(p))).toLowerCase();
    });
    const dirs = new Set(paths.map((path9) => getDirs(path9)).reduce((a, b) => a.concat(b)));
    this.#reservations.set(fn, { dirs, paths });
    for (const p of paths) {
      const q = this.#queues.get(p);
      if (!q) {
        this.#queues.set(p, [fn]);
      } else {
        q.push(fn);
      }
    }
    for (const dir of dirs) {
      const q = this.#queues.get(dir);
      if (!q) {
        this.#queues.set(dir, [/* @__PURE__ */ new Set([fn])]);
      } else {
        const l = q[q.length - 1];
        if (l instanceof Set) {
          l.add(fn);
        } else {
          q.push(/* @__PURE__ */ new Set([fn]));
        }
      }
    }
    return this.#run(fn);
  }
  // return the queues for each path the function cares about
  // fn => {paths, dirs}
  #getQueues(fn) {
    const res = this.#reservations.get(fn);
    if (!res) {
      throw new Error("function does not have any path reservations");
    }
    return {
      paths: res.paths.map((path9) => this.#queues.get(path9)),
      dirs: [...res.dirs].map((path9) => this.#queues.get(path9))
    };
  }
  // check if fn is first in line for all its paths, and is
  // included in the first set for all its dir queues
  check(fn) {
    const { paths, dirs } = this.#getQueues(fn);
    return paths.every((q) => q && q[0] === fn) && dirs.every((q) => q && q[0] instanceof Set && q[0].has(fn));
  }
  // run the function if it's first in line and not already running
  #run(fn) {
    if (this.#running.has(fn) || !this.check(fn)) {
      return false;
    }
    this.#running.add(fn);
    fn(() => this.#clear(fn));
    return true;
  }
  #clear(fn) {
    if (!this.#running.has(fn)) {
      return false;
    }
    const res = this.#reservations.get(fn);
    if (!res) {
      throw new Error("invalid reservation");
    }
    const { paths, dirs } = res;
    const next = /* @__PURE__ */ new Set();
    for (const path9 of paths) {
      const q = this.#queues.get(path9);
      if (!q || q?.[0] !== fn) {
        continue;
      }
      const q0 = q[1];
      if (!q0) {
        this.#queues.delete(path9);
        continue;
      }
      q.shift();
      if (typeof q0 === "function") {
        next.add(q0);
      } else {
        for (const f2 of q0) {
          next.add(f2);
        }
      }
    }
    for (const dir of dirs) {
      const q = this.#queues.get(dir);
      const q0 = q?.[0];
      if (!q || !(q0 instanceof Set))
        continue;
      if (q0.size === 1 && q.length === 1) {
        this.#queues.delete(dir);
        continue;
      } else if (q0.size === 1) {
        q.shift();
        const n = q[0];
        if (typeof n === "function") {
          next.add(n);
        }
      } else {
        q0.delete(fn);
      }
    }
    this.#running.delete(fn);
    next.forEach((fn2) => this.#run(fn2));
    return true;
  }
};

// node_modules/tar/dist/esm/unpack.js
var ONENTRY = Symbol("onEntry");
var CHECKFS = Symbol("checkFs");
var CHECKFS2 = Symbol("checkFs2");
var PRUNECACHE = Symbol("pruneCache");
var ISREUSABLE = Symbol("isReusable");
var MAKEFS = Symbol("makeFs");
var FILE2 = Symbol("file");
var DIRECTORY2 = Symbol("directory");
var LINK = Symbol("link");
var SYMLINK2 = Symbol("symlink");
var HARDLINK2 = Symbol("hardlink");
var UNSUPPORTED = Symbol("unsupported");
var CHECKPATH = Symbol("checkPath");
var MKDIR = Symbol("mkdir");
var ONERROR = Symbol("onError");
var PENDING = Symbol("pending");
var PEND = Symbol("pend");
var UNPEND = Symbol("unpend");
var ENDED3 = Symbol("ended");
var MAYBECLOSE = Symbol("maybeClose");
var SKIP = Symbol("skip");
var DOCHOWN = Symbol("doChown");
var UID = Symbol("uid");
var GID = Symbol("gid");
var CHECKED_CWD = Symbol("checkedCwd");
var platform5 = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var isWindows3 = platform5 === "win32";
var DEFAULT_MAX_DEPTH = 1024;
var unlinkFile = (path9, cb) => {
  if (!isWindows3) {
    return fs8.unlink(path9, cb);
  }
  const name2 = path9 + ".DELETE." + randomBytes(16).toString("hex");
  fs8.rename(path9, name2, (er) => {
    if (er) {
      return cb(er);
    }
    fs8.unlink(name2, cb);
  });
};
var unlinkFileSync = (path9) => {
  if (!isWindows3) {
    return fs8.unlinkSync(path9);
  }
  const name2 = path9 + ".DELETE." + randomBytes(16).toString("hex");
  fs8.renameSync(path9, name2);
  fs8.unlinkSync(name2);
};
var uint32 = (a, b, c) => a !== void 0 && a === a >>> 0 ? a : b !== void 0 && b === b >>> 0 ? b : c;
var cacheKeyNormalize = (path9) => stripTrailingSlashes(normalizeWindowsPath(normalizeUnicode(path9))).toLowerCase();
var pruneCache = (cache, abs2) => {
  abs2 = cacheKeyNormalize(abs2);
  for (const path9 of cache.keys()) {
    const pnorm = cacheKeyNormalize(path9);
    if (pnorm === abs2 || pnorm.indexOf(abs2 + "/") === 0) {
      cache.delete(path9);
    }
  }
};
var dropCache = (cache) => {
  for (const key of cache.keys()) {
    cache.delete(key);
  }
};
var Unpack = class extends Parser {
  [ENDED3] = false;
  [CHECKED_CWD] = false;
  [PENDING] = 0;
  reservations = new PathReservations();
  transform;
  writable = true;
  readable = false;
  dirCache;
  uid;
  gid;
  setOwner;
  preserveOwner;
  processGid;
  processUid;
  maxDepth;
  forceChown;
  win32;
  newer;
  keep;
  noMtime;
  preservePaths;
  unlink;
  cwd;
  strip;
  processUmask;
  umask;
  dmode;
  fmode;
  chmod;
  constructor(opt = {}) {
    opt.ondone = () => {
      this[ENDED3] = true;
      this[MAYBECLOSE]();
    };
    super(opt);
    this.transform = opt.transform;
    this.dirCache = opt.dirCache || /* @__PURE__ */ new Map();
    this.chmod = !!opt.chmod;
    if (typeof opt.uid === "number" || typeof opt.gid === "number") {
      if (typeof opt.uid !== "number" || typeof opt.gid !== "number") {
        throw new TypeError("cannot set owner without number uid and gid");
      }
      if (opt.preserveOwner) {
        throw new TypeError("cannot preserve owner in archive and also set owner explicitly");
      }
      this.uid = opt.uid;
      this.gid = opt.gid;
      this.setOwner = true;
    } else {
      this.uid = void 0;
      this.gid = void 0;
      this.setOwner = false;
    }
    if (opt.preserveOwner === void 0 && typeof opt.uid !== "number") {
      this.preserveOwner = !!(process.getuid && process.getuid() === 0);
    } else {
      this.preserveOwner = !!opt.preserveOwner;
    }
    this.processUid = (this.preserveOwner || this.setOwner) && process.getuid ? process.getuid() : void 0;
    this.processGid = (this.preserveOwner || this.setOwner) && process.getgid ? process.getgid() : void 0;
    this.maxDepth = typeof opt.maxDepth === "number" ? opt.maxDepth : DEFAULT_MAX_DEPTH;
    this.forceChown = opt.forceChown === true;
    this.win32 = !!opt.win32 || isWindows3;
    this.newer = !!opt.newer;
    this.keep = !!opt.keep;
    this.noMtime = !!opt.noMtime;
    this.preservePaths = !!opt.preservePaths;
    this.unlink = !!opt.unlink;
    this.cwd = normalizeWindowsPath(path6.resolve(opt.cwd || process.cwd()));
    this.strip = Number(opt.strip) || 0;
    this.processUmask = !this.chmod ? 0 : typeof opt.processUmask === "number" ? opt.processUmask : process.umask();
    this.umask = typeof opt.umask === "number" ? opt.umask : this.processUmask;
    this.dmode = opt.dmode || 511 & ~this.umask;
    this.fmode = opt.fmode || 438 & ~this.umask;
    this.on("entry", (entry) => this[ONENTRY](entry));
  }
  // a bad or damaged archive is a warning for Parser, but an error
  // when extracting.  Mark those errors as unrecoverable, because
  // the Unpack contract cannot be met.
  warn(code2, msg, data = {}) {
    if (code2 === "TAR_BAD_ARCHIVE" || code2 === "TAR_ABORT") {
      data.recoverable = false;
    }
    return super.warn(code2, msg, data);
  }
  [MAYBECLOSE]() {
    if (this[ENDED3] && this[PENDING] === 0) {
      this.emit("prefinish");
      this.emit("finish");
      this.emit("end");
    }
  }
  [CHECKPATH](entry) {
    const p = normalizeWindowsPath(entry.path);
    const parts = p.split("/");
    if (this.strip) {
      if (parts.length < this.strip) {
        return false;
      }
      if (entry.type === "Link") {
        const linkparts = normalizeWindowsPath(String(entry.linkpath)).split("/");
        if (linkparts.length >= this.strip) {
          entry.linkpath = linkparts.slice(this.strip).join("/");
        } else {
          return false;
        }
      }
      parts.splice(0, this.strip);
      entry.path = parts.join("/");
    }
    if (isFinite(this.maxDepth) && parts.length > this.maxDepth) {
      this.warn("TAR_ENTRY_ERROR", "path excessively deep", {
        entry,
        path: p,
        depth: parts.length,
        maxDepth: this.maxDepth
      });
      return false;
    }
    if (!this.preservePaths) {
      if (parts.includes("..") || /* c8 ignore next */
      isWindows3 && /^[a-z]:\.\.$/i.test(parts[0] ?? "")) {
        this.warn("TAR_ENTRY_ERROR", `path contains '..'`, {
          entry,
          path: p
        });
        return false;
      }
      const [root, stripped] = stripAbsolutePath(p);
      if (root) {
        entry.path = String(stripped);
        this.warn("TAR_ENTRY_INFO", `stripping ${root} from absolute path`, {
          entry,
          path: p
        });
      }
    }
    if (path6.isAbsolute(entry.path)) {
      entry.absolute = normalizeWindowsPath(path6.resolve(entry.path));
    } else {
      entry.absolute = normalizeWindowsPath(path6.resolve(this.cwd, entry.path));
    }
    if (!this.preservePaths && typeof entry.absolute === "string" && entry.absolute.indexOf(this.cwd + "/") !== 0 && entry.absolute !== this.cwd) {
      this.warn("TAR_ENTRY_ERROR", "path escaped extraction target", {
        entry,
        path: normalizeWindowsPath(entry.path),
        resolvedPath: entry.absolute,
        cwd: this.cwd
      });
      return false;
    }
    if (entry.absolute === this.cwd && entry.type !== "Directory" && entry.type !== "GNUDumpDir") {
      return false;
    }
    if (this.win32) {
      const { root: aRoot } = path6.win32.parse(String(entry.absolute));
      entry.absolute = aRoot + encode2(String(entry.absolute).slice(aRoot.length));
      const { root: pRoot } = path6.win32.parse(entry.path);
      entry.path = pRoot + encode2(entry.path.slice(pRoot.length));
    }
    return true;
  }
  [ONENTRY](entry) {
    if (!this[CHECKPATH](entry)) {
      return entry.resume();
    }
    assert2.equal(typeof entry.absolute, "string");
    switch (entry.type) {
      case "Directory":
      case "GNUDumpDir":
        if (entry.mode) {
          entry.mode = entry.mode | 448;
        }
      // eslint-disable-next-line no-fallthrough
      case "File":
      case "OldFile":
      case "ContiguousFile":
      case "Link":
      case "SymbolicLink":
        return this[CHECKFS](entry);
      case "CharacterDevice":
      case "BlockDevice":
      case "FIFO":
      default:
        return this[UNSUPPORTED](entry);
    }
  }
  [ONERROR](er, entry) {
    if (er.name === "CwdError") {
      this.emit("error", er);
    } else {
      this.warn("TAR_ENTRY_ERROR", er, { entry });
      this[UNPEND]();
      entry.resume();
    }
  }
  [MKDIR](dir, mode, cb) {
    mkdir3(normalizeWindowsPath(dir), {
      uid: this.uid,
      gid: this.gid,
      processUid: this.processUid,
      processGid: this.processGid,
      umask: this.processUmask,
      preserve: this.preservePaths,
      unlink: this.unlink,
      cache: this.dirCache,
      cwd: this.cwd,
      mode
    }, cb);
  }
  [DOCHOWN](entry) {
    return this.forceChown || this.preserveOwner && (typeof entry.uid === "number" && entry.uid !== this.processUid || typeof entry.gid === "number" && entry.gid !== this.processGid) || typeof this.uid === "number" && this.uid !== this.processUid || typeof this.gid === "number" && this.gid !== this.processGid;
  }
  [UID](entry) {
    return uint32(this.uid, entry.uid, this.processUid);
  }
  [GID](entry) {
    return uint32(this.gid, entry.gid, this.processGid);
  }
  [FILE2](entry, fullyDone) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.fmode;
    const stream2 = new WriteStream(String(entry.absolute), {
      // slight lie, but it can be numeric flags
      flags: getWriteFlag(entry.size),
      mode,
      autoClose: false
    });
    stream2.on("error", (er) => {
      if (stream2.fd) {
        fs8.close(stream2.fd, () => {
        });
      }
      stream2.write = () => true;
      this[ONERROR](er, entry);
      fullyDone();
    });
    let actions = 1;
    const done = (er) => {
      if (er) {
        if (stream2.fd) {
          fs8.close(stream2.fd, () => {
          });
        }
        this[ONERROR](er, entry);
        fullyDone();
        return;
      }
      if (--actions === 0) {
        if (stream2.fd !== void 0) {
          fs8.close(stream2.fd, (er2) => {
            if (er2) {
              this[ONERROR](er2, entry);
            } else {
              this[UNPEND]();
            }
            fullyDone();
          });
        }
      }
    };
    stream2.on("finish", () => {
      const abs2 = String(entry.absolute);
      const fd2 = stream2.fd;
      if (typeof fd2 === "number" && entry.mtime && !this.noMtime) {
        actions++;
        const atime = entry.atime || /* @__PURE__ */ new Date();
        const mtime = entry.mtime;
        fs8.futimes(fd2, atime, mtime, (er) => er ? fs8.utimes(abs2, atime, mtime, (er2) => done(er2 && er)) : done());
      }
      if (typeof fd2 === "number" && this[DOCHOWN](entry)) {
        actions++;
        const uid = this[UID](entry);
        const gid = this[GID](entry);
        if (typeof uid === "number" && typeof gid === "number") {
          fs8.fchown(fd2, uid, gid, (er) => er ? fs8.chown(abs2, uid, gid, (er2) => done(er2 && er)) : done());
        }
      }
      done();
    });
    const tx = this.transform ? this.transform(entry) || entry : entry;
    if (tx !== entry) {
      tx.on("error", (er) => {
        this[ONERROR](er, entry);
        fullyDone();
      });
      entry.pipe(tx);
    }
    tx.pipe(stream2);
  }
  [DIRECTORY2](entry, fullyDone) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.dmode;
    this[MKDIR](String(entry.absolute), mode, (er) => {
      if (er) {
        this[ONERROR](er, entry);
        fullyDone();
        return;
      }
      let actions = 1;
      const done = () => {
        if (--actions === 0) {
          fullyDone();
          this[UNPEND]();
          entry.resume();
        }
      };
      if (entry.mtime && !this.noMtime) {
        actions++;
        fs8.utimes(String(entry.absolute), entry.atime || /* @__PURE__ */ new Date(), entry.mtime, done);
      }
      if (this[DOCHOWN](entry)) {
        actions++;
        fs8.chown(String(entry.absolute), Number(this[UID](entry)), Number(this[GID](entry)), done);
      }
      done();
    });
  }
  [UNSUPPORTED](entry) {
    entry.unsupported = true;
    this.warn("TAR_ENTRY_UNSUPPORTED", `unsupported entry type: ${entry.type}`, { entry });
    entry.resume();
  }
  [SYMLINK2](entry, done) {
    this[LINK](entry, String(entry.linkpath), "symlink", done);
  }
  [HARDLINK2](entry, done) {
    const linkpath = normalizeWindowsPath(path6.resolve(this.cwd, String(entry.linkpath)));
    this[LINK](entry, linkpath, "link", done);
  }
  [PEND]() {
    this[PENDING]++;
  }
  [UNPEND]() {
    this[PENDING]--;
    this[MAYBECLOSE]();
  }
  [SKIP](entry) {
    this[UNPEND]();
    entry.resume();
  }
  // Check if we can reuse an existing filesystem entry safely and
  // overwrite it, rather than unlinking and recreating
  // Windows doesn't report a useful nlink, so we just never reuse entries
  [ISREUSABLE](entry, st) {
    return entry.type === "File" && !this.unlink && st.isFile() && st.nlink <= 1 && !isWindows3;
  }
  // check if a thing is there, and if so, try to clobber it
  [CHECKFS](entry) {
    this[PEND]();
    const paths = [entry.path];
    if (entry.linkpath) {
      paths.push(entry.linkpath);
    }
    this.reservations.reserve(paths, (done) => this[CHECKFS2](entry, done));
  }
  [PRUNECACHE](entry) {
    if (entry.type === "SymbolicLink") {
      dropCache(this.dirCache);
    } else if (entry.type !== "Directory") {
      pruneCache(this.dirCache, String(entry.absolute));
    }
  }
  [CHECKFS2](entry, fullyDone) {
    this[PRUNECACHE](entry);
    const done = (er) => {
      this[PRUNECACHE](entry);
      fullyDone(er);
    };
    const checkCwd2 = () => {
      this[MKDIR](this.cwd, this.dmode, (er) => {
        if (er) {
          this[ONERROR](er, entry);
          done();
          return;
        }
        this[CHECKED_CWD] = true;
        start();
      });
    };
    const start = () => {
      if (entry.absolute !== this.cwd) {
        const parent = normalizeWindowsPath(path6.dirname(String(entry.absolute)));
        if (parent !== this.cwd) {
          return this[MKDIR](parent, this.dmode, (er) => {
            if (er) {
              this[ONERROR](er, entry);
              done();
              return;
            }
            afterMakeParent();
          });
        }
      }
      afterMakeParent();
    };
    const afterMakeParent = () => {
      fs8.lstat(String(entry.absolute), (lstatEr, st) => {
        if (st && (this.keep || /* c8 ignore next */
        this.newer && st.mtime > (entry.mtime ?? st.mtime))) {
          this[SKIP](entry);
          done();
          return;
        }
        if (lstatEr || this[ISREUSABLE](entry, st)) {
          return this[MAKEFS](null, entry, done);
        }
        if (st.isDirectory()) {
          if (entry.type === "Directory") {
            const needChmod = this.chmod && entry.mode && (st.mode & 4095) !== entry.mode;
            const afterChmod = (er) => this[MAKEFS](er ?? null, entry, done);
            if (!needChmod) {
              return afterChmod();
            }
            return fs8.chmod(String(entry.absolute), Number(entry.mode), afterChmod);
          }
          if (entry.absolute !== this.cwd) {
            return fs8.rmdir(String(entry.absolute), (er) => this[MAKEFS](er ?? null, entry, done));
          }
        }
        if (entry.absolute === this.cwd) {
          return this[MAKEFS](null, entry, done);
        }
        unlinkFile(String(entry.absolute), (er) => this[MAKEFS](er ?? null, entry, done));
      });
    };
    if (this[CHECKED_CWD]) {
      start();
    } else {
      checkCwd2();
    }
  }
  [MAKEFS](er, entry, done) {
    if (er) {
      this[ONERROR](er, entry);
      done();
      return;
    }
    switch (entry.type) {
      case "File":
      case "OldFile":
      case "ContiguousFile":
        return this[FILE2](entry, done);
      case "Link":
        return this[HARDLINK2](entry, done);
      case "SymbolicLink":
        return this[SYMLINK2](entry, done);
      case "Directory":
      case "GNUDumpDir":
        return this[DIRECTORY2](entry, done);
    }
  }
  [LINK](entry, linkpath, link, done) {
    fs8[link](linkpath, String(entry.absolute), (er) => {
      if (er) {
        this[ONERROR](er, entry);
      } else {
        this[UNPEND]();
        entry.resume();
      }
      done();
    });
  }
};
var callSync = (fn) => {
  try {
    return [null, fn()];
  } catch (er) {
    return [er, null];
  }
};
var UnpackSync = class extends Unpack {
  sync = true;
  [MAKEFS](er, entry) {
    return super[MAKEFS](er, entry, () => {
    });
  }
  [CHECKFS](entry) {
    this[PRUNECACHE](entry);
    if (!this[CHECKED_CWD]) {
      const er2 = this[MKDIR](this.cwd, this.dmode);
      if (er2) {
        return this[ONERROR](er2, entry);
      }
      this[CHECKED_CWD] = true;
    }
    if (entry.absolute !== this.cwd) {
      const parent = normalizeWindowsPath(path6.dirname(String(entry.absolute)));
      if (parent !== this.cwd) {
        const mkParent = this[MKDIR](parent, this.dmode);
        if (mkParent) {
          return this[ONERROR](mkParent, entry);
        }
      }
    }
    const [lstatEr, st] = callSync(() => fs8.lstatSync(String(entry.absolute)));
    if (st && (this.keep || /* c8 ignore next */
    this.newer && st.mtime > (entry.mtime ?? st.mtime))) {
      return this[SKIP](entry);
    }
    if (lstatEr || this[ISREUSABLE](entry, st)) {
      return this[MAKEFS](null, entry);
    }
    if (st.isDirectory()) {
      if (entry.type === "Directory") {
        const needChmod = this.chmod && entry.mode && (st.mode & 4095) !== entry.mode;
        const [er3] = needChmod ? callSync(() => {
          fs8.chmodSync(String(entry.absolute), Number(entry.mode));
        }) : [];
        return this[MAKEFS](er3, entry);
      }
      const [er2] = callSync(() => fs8.rmdirSync(String(entry.absolute)));
      this[MAKEFS](er2, entry);
    }
    const [er] = entry.absolute === this.cwd ? [] : callSync(() => unlinkFileSync(String(entry.absolute)));
    this[MAKEFS](er, entry);
  }
  [FILE2](entry, done) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.fmode;
    const oner = (er) => {
      let closeError;
      try {
        fs8.closeSync(fd2);
      } catch (e) {
        closeError = e;
      }
      if (er || closeError) {
        this[ONERROR](er || closeError, entry);
      }
      done();
    };
    let fd2;
    try {
      fd2 = fs8.openSync(String(entry.absolute), getWriteFlag(entry.size), mode);
    } catch (er) {
      return oner(er);
    }
    const tx = this.transform ? this.transform(entry) || entry : entry;
    if (tx !== entry) {
      tx.on("error", (er) => this[ONERROR](er, entry));
      entry.pipe(tx);
    }
    tx.on("data", (chunk) => {
      try {
        fs8.writeSync(fd2, chunk, 0, chunk.length);
      } catch (er) {
        oner(er);
      }
    });
    tx.on("end", () => {
      let er = null;
      if (entry.mtime && !this.noMtime) {
        const atime = entry.atime || /* @__PURE__ */ new Date();
        const mtime = entry.mtime;
        try {
          fs8.futimesSync(fd2, atime, mtime);
        } catch (futimeser) {
          try {
            fs8.utimesSync(String(entry.absolute), atime, mtime);
          } catch (utimeser) {
            er = futimeser;
          }
        }
      }
      if (this[DOCHOWN](entry)) {
        const uid = this[UID](entry);
        const gid = this[GID](entry);
        try {
          fs8.fchownSync(fd2, Number(uid), Number(gid));
        } catch (fchowner) {
          try {
            fs8.chownSync(String(entry.absolute), Number(uid), Number(gid));
          } catch (chowner) {
            er = er || fchowner;
          }
        }
      }
      oner(er);
    });
  }
  [DIRECTORY2](entry, done) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.dmode;
    const er = this[MKDIR](String(entry.absolute), mode);
    if (er) {
      this[ONERROR](er, entry);
      done();
      return;
    }
    if (entry.mtime && !this.noMtime) {
      try {
        fs8.utimesSync(String(entry.absolute), entry.atime || /* @__PURE__ */ new Date(), entry.mtime);
      } catch (er2) {
      }
    }
    if (this[DOCHOWN](entry)) {
      try {
        fs8.chownSync(String(entry.absolute), Number(this[UID](entry)), Number(this[GID](entry)));
      } catch (er2) {
      }
    }
    done();
    entry.resume();
  }
  [MKDIR](dir, mode) {
    try {
      return mkdirSync3(normalizeWindowsPath(dir), {
        uid: this.uid,
        gid: this.gid,
        processUid: this.processUid,
        processGid: this.processGid,
        umask: this.processUmask,
        preserve: this.preservePaths,
        unlink: this.unlink,
        cache: this.dirCache,
        cwd: this.cwd,
        mode
      });
    } catch (er) {
      return er;
    }
  }
  [LINK](entry, linkpath, link, done) {
    const ls = `${link}Sync`;
    try {
      fs8[ls](linkpath, String(entry.absolute));
      done();
      entry.resume();
    } catch (er) {
      return this[ONERROR](er, entry);
    }
  }
};

// node_modules/tar/dist/esm/extract.js
var extractFileSync = (opt) => {
  const u = new UnpackSync(opt);
  const file = opt.file;
  const stat2 = fs9.statSync(file);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const stream2 = new ReadStreamSync(file, {
    readSize,
    size: stat2.size
  });
  stream2.pipe(u);
};
var extractFile = (opt, _) => {
  const u = new Unpack(opt);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const file = opt.file;
  const p = new Promise((resolve2, reject) => {
    u.on("error", reject);
    u.on("close", resolve2);
    fs9.stat(file, (er, stat2) => {
      if (er) {
        reject(er);
      } else {
        const stream2 = new ReadStream(file, {
          readSize,
          size: stat2.size
        });
        stream2.on("error", reject);
        stream2.pipe(u);
      }
    });
  });
  return p;
};
var extract = makeCommand(extractFileSync, extractFile, (opt) => new UnpackSync(opt), (opt) => new Unpack(opt), (opt, files) => {
  if (files?.length)
    filesFilter(opt, files);
});

// node_modules/tar/dist/esm/replace.js
import fs10 from "node:fs";
import path7 from "node:path";
var replaceSync = (opt, files) => {
  const p = new PackSync(opt);
  let threw = true;
  let fd2;
  let position;
  try {
    try {
      fd2 = fs10.openSync(opt.file, "r+");
    } catch (er) {
      if (er?.code === "ENOENT") {
        fd2 = fs10.openSync(opt.file, "w+");
      } else {
        throw er;
      }
    }
    const st = fs10.fstatSync(fd2);
    const headBuf = Buffer.alloc(512);
    POSITION: for (position = 0; position < st.size; position += 512) {
      for (let bufPos = 0, bytes2 = 0; bufPos < 512; bufPos += bytes2) {
        bytes2 = fs10.readSync(fd2, headBuf, bufPos, headBuf.length - bufPos, position + bufPos);
        if (position === 0 && headBuf[0] === 31 && headBuf[1] === 139) {
          throw new Error("cannot append to compressed archives");
        }
        if (!bytes2) {
          break POSITION;
        }
      }
      const h = new Header(headBuf);
      if (!h.cksumValid) {
        break;
      }
      const entryBlockSize = 512 * Math.ceil((h.size || 0) / 512);
      if (position + entryBlockSize + 512 > st.size) {
        break;
      }
      position += entryBlockSize;
      if (opt.mtimeCache && h.mtime) {
        opt.mtimeCache.set(String(h.path), h.mtime);
      }
    }
    threw = false;
    streamSync(opt, p, position, fd2, files);
  } finally {
    if (threw) {
      try {
        fs10.closeSync(fd2);
      } catch (er) {
      }
    }
  }
};
var streamSync = (opt, p, position, fd2, files) => {
  const stream2 = new WriteStreamSync(opt.file, {
    fd: fd2,
    start: position
  });
  p.pipe(stream2);
  addFilesSync2(p, files);
};
var replaceAsync = (opt, files) => {
  files = Array.from(files);
  const p = new Pack(opt);
  const getPos = (fd2, size, cb_) => {
    const cb = (er, pos2) => {
      if (er) {
        fs10.close(fd2, (_) => cb_(er));
      } else {
        cb_(null, pos2);
      }
    };
    let position = 0;
    if (size === 0) {
      return cb(null, 0);
    }
    let bufPos = 0;
    const headBuf = Buffer.alloc(512);
    const onread = (er, bytes2) => {
      if (er || typeof bytes2 === "undefined") {
        return cb(er);
      }
      bufPos += bytes2;
      if (bufPos < 512 && bytes2) {
        return fs10.read(fd2, headBuf, bufPos, headBuf.length - bufPos, position + bufPos, onread);
      }
      if (position === 0 && headBuf[0] === 31 && headBuf[1] === 139) {
        return cb(new Error("cannot append to compressed archives"));
      }
      if (bufPos < 512) {
        return cb(null, position);
      }
      const h = new Header(headBuf);
      if (!h.cksumValid) {
        return cb(null, position);
      }
      const entryBlockSize = 512 * Math.ceil((h.size ?? 0) / 512);
      if (position + entryBlockSize + 512 > size) {
        return cb(null, position);
      }
      position += entryBlockSize + 512;
      if (position >= size) {
        return cb(null, position);
      }
      if (opt.mtimeCache && h.mtime) {
        opt.mtimeCache.set(String(h.path), h.mtime);
      }
      bufPos = 0;
      fs10.read(fd2, headBuf, 0, 512, position, onread);
    };
    fs10.read(fd2, headBuf, 0, 512, position, onread);
  };
  const promise = new Promise((resolve2, reject) => {
    p.on("error", reject);
    let flag = "r+";
    const onopen = (er, fd2) => {
      if (er && er.code === "ENOENT" && flag === "r+") {
        flag = "w+";
        return fs10.open(opt.file, flag, onopen);
      }
      if (er || !fd2) {
        return reject(er);
      }
      fs10.fstat(fd2, (er2, st) => {
        if (er2) {
          return fs10.close(fd2, () => reject(er2));
        }
        getPos(fd2, st.size, (er3, position) => {
          if (er3) {
            return reject(er3);
          }
          const stream2 = new WriteStream(opt.file, {
            fd: fd2,
            start: position
          });
          p.pipe(stream2);
          stream2.on("error", reject);
          stream2.on("close", resolve2);
          addFilesAsync2(p, files);
        });
      });
    };
    fs10.open(opt.file, flag, onopen);
  });
  return promise;
};
var addFilesSync2 = (p, files) => {
  files.forEach((file) => {
    if (file.charAt(0) === "@") {
      list({
        file: path7.resolve(p.cwd, file.slice(1)),
        sync: true,
        noResume: true,
        onReadEntry: (entry) => p.add(entry)
      });
    } else {
      p.add(file);
    }
  });
  p.end();
};
var addFilesAsync2 = async (p, files) => {
  for (let i = 0; i < files.length; i++) {
    const file = String(files[i]);
    if (file.charAt(0) === "@") {
      await list({
        file: path7.resolve(String(p.cwd), file.slice(1)),
        noResume: true,
        onReadEntry: (entry) => p.add(entry)
      });
    } else {
      p.add(file);
    }
  }
  p.end();
};
var replace = makeCommand(
  replaceSync,
  replaceAsync,
  /* c8 ignore start */
  () => {
    throw new TypeError("file is required");
  },
  () => {
    throw new TypeError("file is required");
  },
  /* c8 ignore stop */
  (opt, entries) => {
    if (!isFile(opt)) {
      throw new TypeError("file is required");
    }
    if (opt.gzip || opt.brotli || opt.file.endsWith(".br") || opt.file.endsWith(".tbr")) {
      throw new TypeError("cannot append to compressed archives");
    }
    if (!entries?.length) {
      throw new TypeError("no paths specified to add/replace");
    }
  }
);

// node_modules/tar/dist/esm/update.js
var update = makeCommand(replace.syncFile, replace.asyncFile, replace.syncNoFile, replace.asyncNoFile, (opt, entries = []) => {
  replace.validate?.(opt, entries);
  mtimeFilter(opt);
});
var mtimeFilter = (opt) => {
  const filter = opt.filter;
  if (!opt.mtimeCache) {
    opt.mtimeCache = /* @__PURE__ */ new Map();
  }
  opt.filter = filter ? (path9, stat2) => filter(path9, stat2) && !/* c8 ignore start */
  ((opt.mtimeCache?.get(path9) ?? stat2.mtime ?? 0) > (stat2.mtime ?? 0)) : (path9, stat2) => !/* c8 ignore start */
  ((opt.mtimeCache?.get(path9) ?? stat2.mtime ?? 0) > (stat2.mtime ?? 0));
};

// cli.js
import os from "os";
import { pipeline } from "stream/promises";

// node_modules/openpgp/dist/node/openpgp.mjs
import { createRequire } from "module";
import * as nc from "node:crypto";
var globalThis = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function _mergeNamespaces(n, m) {
  m.forEach(function(e) {
    e && typeof e !== "string" && !Array.isArray(e) && Object.keys(e).forEach(function(k) {
      if (k !== "default" && !(k in n)) {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function() {
            return e[k];
          }
        });
      }
    });
  });
  return Object.freeze(n);
}
var doneWritingPromise = Symbol("doneWritingPromise");
var doneWritingResolve = Symbol("doneWritingResolve");
var doneWritingReject = Symbol("doneWritingReject");
var readingIndex = Symbol("readingIndex");
var ArrayStream = class _ArrayStream extends Array {
  constructor() {
    super();
    Object.setPrototypeOf(this, _ArrayStream.prototype);
    this[doneWritingPromise] = new Promise((resolve2, reject) => {
      this[doneWritingResolve] = resolve2;
      this[doneWritingReject] = reject;
    });
    this[doneWritingPromise].catch(() => {
    });
  }
};
ArrayStream.prototype.getReader = function() {
  if (this[readingIndex] === void 0) {
    this[readingIndex] = 0;
  }
  return {
    read: async () => {
      await this[doneWritingPromise];
      if (this[readingIndex] === this.length) {
        return { value: void 0, done: true };
      }
      return { value: this[this[readingIndex]++], done: false };
    }
  };
};
ArrayStream.prototype.readToEnd = async function(join2) {
  await this[doneWritingPromise];
  const result = join2(this.slice(this[readingIndex]));
  this.length = 0;
  return result;
};
ArrayStream.prototype.clone = function() {
  const clone2 = new ArrayStream();
  clone2[doneWritingPromise] = this[doneWritingPromise].then(() => {
    clone2.push(...this);
  });
  return clone2;
};
function isArrayStream(input) {
  return input && input.getReader && Array.isArray(input);
}
function Writer(input) {
  if (!isArrayStream(input)) {
    const writer = input.getWriter();
    const releaseLock = writer.releaseLock;
    writer.releaseLock = () => {
      writer.closed.catch(function() {
      });
      releaseLock.call(writer);
    };
    return writer;
  }
  this.stream = input;
}
Writer.prototype.write = async function(chunk) {
  this.stream.push(chunk);
};
Writer.prototype.close = async function() {
  this.stream[doneWritingResolve]();
};
Writer.prototype.abort = async function(reason) {
  this.stream[doneWritingReject](reason);
  return reason;
};
Writer.prototype.releaseLock = function() {
};
typeof globalThis.process === "object" && typeof globalThis.process.versions === "object";
function isStream2(input) {
  if (isArrayStream(input)) {
    return "array";
  }
  if (globalThis.ReadableStream && globalThis.ReadableStream.prototype.isPrototypeOf(input)) {
    return "web";
  }
  if (input && !(globalThis.ReadableStream && input instanceof globalThis.ReadableStream) && typeof input._read === "function" && typeof input._readableState === "object") {
    throw new Error("Native Node streams are no longer supported: please manually convert the stream to a WebStream, using e.g. `stream.Readable.toWeb`");
  }
  if (input && input.getReader) {
    return "web-like";
  }
  return false;
}
function isUint8Array(input) {
  return Uint8Array.prototype.isPrototypeOf(input);
}
function concatUint8Array(arrays) {
  if (arrays.length === 1) return arrays[0];
  let totalLength = 0;
  for (let i = 0; i < arrays.length; i++) {
    if (!isUint8Array(arrays[i])) {
      throw new Error("concatUint8Array: Data must be in the form of a Uint8Array");
    }
    totalLength += arrays[i].length;
  }
  const result = new Uint8Array(totalLength);
  let pos2 = 0;
  arrays.forEach(function(element) {
    result.set(element, pos2);
    pos2 += element.length;
  });
  return result;
}
var doneReadingSet = /* @__PURE__ */ new WeakSet();
var externalBuffer = Symbol("externalBuffer");
function Reader(input) {
  this.stream = input;
  if (input[externalBuffer]) {
    this[externalBuffer] = input[externalBuffer].slice();
  }
  if (isArrayStream(input)) {
    const reader = input.getReader();
    this._read = reader.read.bind(reader);
    this._releaseLock = () => {
    };
    this._cancel = () => {
    };
    return;
  }
  let streamType = isStream2(input);
  if (streamType) {
    const reader = input.getReader();
    this._read = reader.read.bind(reader);
    this._releaseLock = () => {
      reader.closed.catch(function() {
      });
      reader.releaseLock();
    };
    this._cancel = reader.cancel.bind(reader);
    return;
  }
  let doneReading = false;
  this._read = async () => {
    if (doneReading || doneReadingSet.has(input)) {
      return { value: void 0, done: true };
    }
    doneReading = true;
    return { value: input, done: false };
  };
  this._releaseLock = () => {
    if (doneReading) {
      try {
        doneReadingSet.add(input);
      } catch (e) {
      }
    }
  };
}
Reader.prototype.read = async function() {
  if (this[externalBuffer] && this[externalBuffer].length) {
    const value = this[externalBuffer].shift();
    return { done: false, value };
  }
  return this._read();
};
Reader.prototype.releaseLock = function() {
  if (this[externalBuffer]) {
    this.stream[externalBuffer] = this[externalBuffer];
  }
  this._releaseLock();
};
Reader.prototype.cancel = function(reason) {
  return this._cancel(reason);
};
Reader.prototype.readLine = async function() {
  let buffer = [];
  let returnVal;
  while (!returnVal) {
    let { done, value } = await this.read();
    value += "";
    if (done) {
      if (buffer.length) return concat(buffer);
      return;
    }
    const lineEndIndex = value.indexOf("\n") + 1;
    if (lineEndIndex) {
      returnVal = concat(buffer.concat(value.substr(0, lineEndIndex)));
      buffer = [];
    }
    if (lineEndIndex !== value.length) {
      buffer.push(value.substr(lineEndIndex));
    }
  }
  this.unshift(...buffer);
  return returnVal;
};
Reader.prototype.readByte = async function() {
  const { done, value } = await this.read();
  if (done) return;
  const byte = value[0];
  this.unshift(slice(value, 1));
  return byte;
};
Reader.prototype.readBytes = async function(length) {
  const buffer = [];
  let bufferLength = 0;
  while (true) {
    const { done, value } = await this.read();
    if (done) {
      if (buffer.length) return concat(buffer);
      return;
    }
    buffer.push(value);
    bufferLength += value.length;
    if (bufferLength >= length) {
      const bufferConcat = concat(buffer);
      this.unshift(slice(bufferConcat, length));
      return slice(bufferConcat, 0, length);
    }
  }
};
Reader.prototype.peekBytes = async function(length) {
  const bytes2 = await this.readBytes(length);
  this.unshift(bytes2);
  return bytes2;
};
Reader.prototype.unshift = function(...values) {
  if (!this[externalBuffer]) {
    this[externalBuffer] = [];
  }
  if (values.length === 1 && isUint8Array(values[0]) && this[externalBuffer].length && values[0].length && this[externalBuffer][0].byteOffset >= values[0].length) {
    this[externalBuffer][0] = new Uint8Array(
      this[externalBuffer][0].buffer,
      this[externalBuffer][0].byteOffset - values[0].length,
      this[externalBuffer][0].byteLength + values[0].length
    );
    return;
  }
  this[externalBuffer].unshift(...values.filter((value) => value && value.length));
};
Reader.prototype.readToEnd = async function(join2 = concat) {
  const result = [];
  while (true) {
    const { done, value } = await this.read();
    if (done) break;
    result.push(value);
  }
  return join2(result);
};
function toStream(input) {
  let streamType = isStream2(input);
  if (streamType) {
    return input;
  }
  return new ReadableStream({
    start(controller) {
      controller.enqueue(input);
      controller.close();
    }
  });
}
function toArrayStream(input) {
  if (isStream2(input)) {
    return input;
  }
  const stream2 = new ArrayStream();
  (async () => {
    const writer = getWriter(stream2);
    await writer.write(input);
    await writer.close();
  })();
  return stream2;
}
function concat(list2) {
  if (list2.some((stream2) => isStream2(stream2) && !isArrayStream(stream2))) {
    return concatStream(list2);
  }
  if (list2.some((stream2) => isArrayStream(stream2))) {
    return concatArrayStream(list2);
  }
  if (typeof list2[0] === "string") {
    return list2.join("");
  }
  return concatUint8Array(list2);
}
function concatStream(list2) {
  list2 = list2.map(toStream);
  const transform2 = transformWithCancel(async function(reason) {
    await Promise.all(transforms.map((stream2) => cancel(stream2, reason)));
  });
  let prev = Promise.resolve();
  const transforms = list2.map((stream2, i) => transformPair(stream2, (readable, writable) => {
    prev = prev.then(() => pipe(readable, transform2.writable, {
      preventClose: i !== list2.length - 1
    }));
    return prev;
  }));
  return transform2.readable;
}
function concatArrayStream(list2) {
  const result = new ArrayStream();
  let prev = Promise.resolve();
  list2.forEach((stream2, i) => {
    prev = prev.then(() => pipe(stream2, result, {
      preventClose: i !== list2.length - 1
    }));
    return prev;
  });
  return result;
}
async function pipe(input, target, {
  preventClose = false,
  preventAbort = false,
  preventCancel = false
} = {}) {
  if (isStream2(input) && !isArrayStream(input)) {
    input = toStream(input);
    try {
      if (input[externalBuffer]) {
        const writer2 = getWriter(target);
        for (let i = 0; i < input[externalBuffer].length; i++) {
          await writer2.ready;
          await writer2.write(input[externalBuffer][i]);
        }
        writer2.releaseLock();
      }
      await input.pipeTo(target, {
        preventClose,
        preventAbort,
        preventCancel
      });
    } catch (e) {
    }
    return;
  }
  input = toArrayStream(input);
  const reader = getReader(input);
  const writer = getWriter(target);
  try {
    while (true) {
      await writer.ready;
      const { done, value } = await reader.read();
      if (done) {
        if (!preventClose) await writer.close();
        break;
      }
      await writer.write(value);
    }
  } catch (e) {
    if (!preventAbort) await writer.abort(e);
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}
function transformRaw(input, options) {
  const transformStream = new TransformStream(options);
  pipe(input, transformStream.writable);
  return transformStream.readable;
}
function transformWithCancel(customCancel) {
  let pulled = false;
  let cancelled = false;
  let backpressureChangePromiseResolve, backpressureChangePromiseReject;
  let outputController;
  return {
    readable: new ReadableStream({
      start(controller) {
        outputController = controller;
      },
      pull() {
        if (backpressureChangePromiseResolve) {
          backpressureChangePromiseResolve();
        } else {
          pulled = true;
        }
      },
      async cancel(reason) {
        cancelled = true;
        if (customCancel) {
          await customCancel(reason);
        }
        if (backpressureChangePromiseReject) {
          backpressureChangePromiseReject(reason);
        }
      }
    }, { highWaterMark: 0 }),
    writable: new WritableStream({
      write: async function(chunk) {
        if (cancelled) {
          throw new Error("Stream is cancelled");
        }
        outputController.enqueue(chunk);
        if (!pulled) {
          await new Promise((resolve2, reject) => {
            backpressureChangePromiseResolve = resolve2;
            backpressureChangePromiseReject = reject;
          });
          backpressureChangePromiseResolve = null;
          backpressureChangePromiseReject = null;
        } else {
          pulled = false;
        }
      },
      close: outputController.close.bind(outputController),
      abort: outputController.error.bind(outputController)
    })
  };
}
function transform(input, process2 = () => void 0, finish = () => void 0) {
  if (isArrayStream(input)) {
    const output2 = new ArrayStream();
    (async () => {
      const writer = getWriter(output2);
      try {
        const data = await readToEnd(input);
        const result12 = process2(data);
        const result22 = finish();
        let result;
        if (result12 !== void 0 && result22 !== void 0) result = concat([result12, result22]);
        else result = result12 !== void 0 ? result12 : result22;
        await writer.write(result);
        await writer.close();
      } catch (e) {
        await writer.abort(e);
      }
    })();
    return output2;
  }
  if (isStream2(input)) {
    return transformRaw(input, {
      async transform(value, controller) {
        try {
          const result = await process2(value);
          if (result !== void 0) controller.enqueue(result);
        } catch (e) {
          controller.error(e);
        }
      },
      async flush(controller) {
        try {
          const result = await finish();
          if (result !== void 0) controller.enqueue(result);
        } catch (e) {
          controller.error(e);
        }
      }
    });
  }
  const result1 = process2(input);
  const result2 = finish();
  if (result1 !== void 0 && result2 !== void 0) return concat([result1, result2]);
  return result1 !== void 0 ? result1 : result2;
}
function transformPair(input, fn) {
  if (isStream2(input) && !isArrayStream(input)) {
    let incomingTransformController;
    const incoming = new TransformStream({
      start(controller) {
        incomingTransformController = controller;
      }
    });
    const pipeDonePromise = pipe(input, incoming.writable);
    const outgoing = transformWithCancel(async function(reason) {
      incomingTransformController.error(reason);
      await pipeDonePromise;
      await new Promise(setTimeout);
    });
    fn(incoming.readable, outgoing.writable);
    return outgoing.readable;
  }
  input = toArrayStream(input);
  const output2 = new ArrayStream();
  fn(input, output2);
  return output2;
}
function parse5(input, fn) {
  let returnValue;
  const transformed = transformPair(input, (readable, writable) => {
    const reader = getReader(readable);
    reader.remainder = () => {
      reader.releaseLock();
      pipe(readable, writable);
      return transformed;
    };
    returnValue = fn(reader);
  });
  return returnValue;
}
function tee(input) {
  if (isArrayStream(input)) {
    throw new Error("ArrayStream cannot be tee()d, use clone() instead");
  }
  if (isStream2(input)) {
    const teed = toStream(input).tee();
    teed[0][externalBuffer] = teed[1][externalBuffer] = input[externalBuffer];
    return teed;
  }
  return [slice(input), slice(input)];
}
function clone(input) {
  if (isArrayStream(input)) {
    return input.clone();
  }
  if (isStream2(input)) {
    const teed = tee(input);
    overwrite(input, teed[0]);
    return teed[1];
  }
  return slice(input);
}
function passiveClone(input) {
  if (isArrayStream(input)) {
    return clone(input);
  }
  if (isStream2(input)) {
    return new ReadableStream({
      start(controller) {
        const transformed = transformPair(input, async (readable, writable) => {
          const reader = getReader(readable);
          const writer = getWriter(writable);
          try {
            while (true) {
              await writer.ready;
              const { done, value } = await reader.read();
              if (done) {
                try {
                  controller.close();
                } catch (e) {
                }
                await writer.close();
                return;
              }
              try {
                controller.enqueue(value);
              } catch (e) {
              }
              await writer.write(value);
            }
          } catch (e) {
            controller.error(e);
            await writer.abort(e);
          }
        });
        overwrite(input, transformed);
      }
    });
  }
  return slice(input);
}
function overwrite(input, clone2) {
  Object.entries(Object.getOwnPropertyDescriptors(input.constructor.prototype)).forEach(([name2, descriptor]) => {
    if (name2 === "constructor") {
      return;
    }
    if (descriptor.value) {
      descriptor.value = descriptor.value.bind(clone2);
    } else {
      descriptor.get = descriptor.get.bind(clone2);
    }
    Object.defineProperty(input, name2, descriptor);
  });
}
function slice(input, begin = 0, end = Infinity) {
  if (isArrayStream(input)) {
    throw new Error("Not implemented");
  }
  if (isStream2(input)) {
    if (begin >= 0 && end >= 0) {
      let bytesRead = 0;
      return transformRaw(input, {
        transform(value, controller) {
          if (bytesRead < end) {
            if (bytesRead + value.length >= begin) {
              controller.enqueue(slice(value, Math.max(begin - bytesRead, 0), end - bytesRead));
            }
            bytesRead += value.length;
          } else {
            controller.terminate();
          }
        }
      });
    }
    if (begin < 0 && (end < 0 || end === Infinity)) {
      let lastBytes = [];
      return transform(input, (value) => {
        if (value.length >= -begin) lastBytes = [value];
        else lastBytes.push(value);
      }, () => slice(concat(lastBytes), begin, end));
    }
    if (begin === 0 && end < 0) {
      let lastBytes;
      return transform(input, (value) => {
        const returnValue = lastBytes ? concat([lastBytes, value]) : value;
        if (returnValue.length >= -end) {
          lastBytes = slice(returnValue, end);
          return slice(returnValue, begin, end);
        }
        lastBytes = returnValue;
      });
    }
    console.warn(`stream.slice(input, ${begin}, ${end}) not implemented efficiently.`);
    return fromAsync(async () => slice(await readToEnd(input), begin, end));
  }
  if (input[externalBuffer]) {
    input = concat(input[externalBuffer].concat([input]));
  }
  if (isUint8Array(input)) {
    return input.subarray(begin, end === Infinity ? input.length : end);
  }
  return input.slice(begin, end);
}
async function readToEnd(input, join2 = concat) {
  if (isArrayStream(input)) {
    return input.readToEnd(join2);
  }
  if (isStream2(input)) {
    return getReader(input).readToEnd(join2);
  }
  return input;
}
async function cancel(input, reason) {
  if (isStream2(input)) {
    if (input.cancel) {
      const cancelled = await input.cancel(reason);
      await new Promise(setTimeout);
      return cancelled;
    }
    if (input.destroy) {
      input.destroy(reason);
      await new Promise(setTimeout);
      return reason;
    }
  }
}
function fromAsync(fn) {
  const arrayStream = new ArrayStream();
  (async () => {
    const writer = getWriter(arrayStream);
    try {
      await writer.write(await fn());
      await writer.close();
    } catch (e) {
      await writer.abort(e);
    }
  })();
  return arrayStream;
}
function getReader(input) {
  return new Reader(input);
}
function getWriter(input) {
  return new Writer(input);
}
var byValue = Symbol("byValue");
var enums = {
  /** Maps curve names under various standards to one
   * @see {@link https://wiki.gnupg.org/ECC|ECC - GnuPG wiki}
   * @enum {String}
   * @readonly
   */
  curve: {
    /** NIST P-256 Curve */
    "nistP256": "nistP256",
    /** @deprecated use `nistP256` instead */
    "p256": "nistP256",
    /** NIST P-384 Curve */
    "nistP384": "nistP384",
    /** @deprecated use `nistP384` instead */
    "p384": "nistP384",
    /** NIST P-521 Curve */
    "nistP521": "nistP521",
    /** @deprecated use `nistP521` instead */
    "p521": "nistP521",
    /** SECG SECP256k1 Curve */
    "secp256k1": "secp256k1",
    /** Ed25519 - deprecated by crypto-refresh (replaced by standaone Ed25519 algo) */
    "ed25519Legacy": "ed25519Legacy",
    /** @deprecated use `ed25519Legacy` instead */
    "ed25519": "ed25519Legacy",
    /** Curve25519 - deprecated by crypto-refresh (replaced by standaone X25519 algo) */
    "curve25519Legacy": "curve25519Legacy",
    /** @deprecated use `curve25519Legacy` instead */
    "curve25519": "curve25519Legacy",
    /** BrainpoolP256r1 Curve */
    "brainpoolP256r1": "brainpoolP256r1",
    /** BrainpoolP384r1 Curve */
    "brainpoolP384r1": "brainpoolP384r1",
    /** BrainpoolP512r1 Curve */
    "brainpoolP512r1": "brainpoolP512r1"
  },
  /** A string to key specifier type
   * @enum {Integer}
   * @readonly
   */
  s2k: {
    simple: 0,
    salted: 1,
    iterated: 3,
    argon2: 4,
    gnu: 101
  },
  /** {@link https://tools.ietf.org/html/draft-ietf-openpgp-crypto-refresh-08.html#section-9.1|crypto-refresh RFC, section 9.1}
   * @enum {Integer}
   * @readonly
   */
  publicKey: {
    /** RSA (Encrypt or Sign) [HAC] */
    rsaEncryptSign: 1,
    /** RSA (Encrypt only) [HAC] */
    rsaEncrypt: 2,
    /** RSA (Sign only) [HAC] */
    rsaSign: 3,
    /** Elgamal (Encrypt only) [ELGAMAL] [HAC] */
    elgamal: 16,
    /** DSA (Sign only) [FIPS186] [HAC] */
    dsa: 17,
    /** ECDH (Encrypt only) [RFC6637] */
    ecdh: 18,
    /** ECDSA (Sign only) [RFC6637] */
    ecdsa: 19,
    /** EdDSA (Sign only) - deprecated by crypto-refresh (replaced by `ed25519` identifier below)
     * [{@link https://tools.ietf.org/html/draft-koch-eddsa-for-openpgp-04|Draft RFC}] */
    eddsaLegacy: 22,
    /** Reserved for AEDH */
    aedh: 23,
    /** Reserved for AEDSA */
    aedsa: 24,
    /** X25519 (Encrypt only) */
    x25519: 25,
    /** X448 (Encrypt only) */
    x448: 26,
    /** Ed25519 (Sign only) */
    ed25519: 27,
    /** Ed448 (Sign only) */
    ed448: 28
  },
  /** {@link https://tools.ietf.org/html/rfc4880#section-9.2|RFC4880, section 9.2}
   * @enum {Integer}
   * @readonly
   */
  symmetric: {
    /** Not implemented! */
    idea: 1,
    tripledes: 2,
    cast5: 3,
    blowfish: 4,
    aes128: 7,
    aes192: 8,
    aes256: 9,
    twofish: 10
  },
  /** {@link https://tools.ietf.org/html/rfc4880#section-9.3|RFC4880, section 9.3}
   * @enum {Integer}
   * @readonly
   */
  compression: {
    uncompressed: 0,
    /** RFC1951 */
    zip: 1,
    /** RFC1950 */
    zlib: 2,
    bzip2: 3
  },
  /** {@link https://tools.ietf.org/html/rfc4880#section-9.4|RFC4880, section 9.4}
   * @enum {Integer}
   * @readonly
   */
  hash: {
    md5: 1,
    sha1: 2,
    ripemd: 3,
    sha256: 8,
    sha384: 9,
    sha512: 10,
    sha224: 11,
    sha3_256: 12,
    sha3_512: 14
  },
  /** A list of hash names as accepted by webCrypto functions.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest|Parameters, algo}
   * @enum {String}
   */
  webHash: {
    "SHA-1": 2,
    "SHA-256": 8,
    "SHA-384": 9,
    "SHA-512": 10
  },
  /** {@link https://www.rfc-editor.org/rfc/rfc9580.html#name-aead-algorithms}
   * @enum {Integer}
   * @readonly
   */
  aead: {
    eax: 1,
    ocb: 2,
    gcm: 3,
    /** @deprecated used by OpenPGP.js v5 for legacy AEAD support; use `gcm` instead for the RFC9580-standardized ID */
    experimentalGCM: 100
    // Private algorithm
  },
  /** A list of packet types and numeric tags associated with them.
   * @enum {Integer}
   * @readonly
   */
  packet: {
    publicKeyEncryptedSessionKey: 1,
    signature: 2,
    symEncryptedSessionKey: 3,
    onePassSignature: 4,
    secretKey: 5,
    publicKey: 6,
    secretSubkey: 7,
    compressedData: 8,
    symmetricallyEncryptedData: 9,
    marker: 10,
    literalData: 11,
    trust: 12,
    userID: 13,
    publicSubkey: 14,
    userAttribute: 17,
    symEncryptedIntegrityProtectedData: 18,
    modificationDetectionCode: 19,
    aeadEncryptedData: 20,
    // see IETF draft: https://tools.ietf.org/html/draft-ford-openpgp-format-00#section-2.1
    padding: 21
  },
  /** Data types in the literal packet
   * @enum {Integer}
   * @readonly
   */
  literal: {
    /** Binary data 'b' */
    binary: "b".charCodeAt(),
    /** Text data 't' */
    text: "t".charCodeAt(),
    /** Utf8 data 'u' */
    utf8: "u".charCodeAt(),
    /** MIME message body part 'm' */
    mime: "m".charCodeAt()
  },
  /** One pass signature packet type
   * @enum {Integer}
   * @readonly
   */
  signature: {
    /** 0x00: Signature of a binary document. */
    binary: 0,
    /** 0x01: Signature of a canonical text document.
     *
     * Canonicalyzing the document by converting line endings. */
    text: 1,
    /** 0x02: Standalone signature.
     *
     * This signature is a signature of only its own subpacket contents.
     * It is calculated identically to a signature over a zero-lengh
     * binary document.  Note that it doesn't make sense to have a V3
     * standalone signature. */
    standalone: 2,
    /** 0x10: Generic certification of a User ID and Public-Key packet.
     *
     * The issuer of this certification does not make any particular
     * assertion as to how well the certifier has checked that the owner
     * of the key is in fact the person described by the User ID. */
    certGeneric: 16,
    /** 0x11: Persona certification of a User ID and Public-Key packet.
     *
     * The issuer of this certification has not done any verification of
     * the claim that the owner of this key is the User ID specified. */
    certPersona: 17,
    /** 0x12: Casual certification of a User ID and Public-Key packet.
     *
     * The issuer of this certification has done some casual
     * verification of the claim of identity. */
    certCasual: 18,
    /** 0x13: Positive certification of a User ID and Public-Key packet.
     *
     * The issuer of this certification has done substantial
     * verification of the claim of identity.
     *
     * Most OpenPGP implementations make their "key signatures" as 0x10
     * certifications.  Some implementations can issue 0x11-0x13
     * certifications, but few differentiate between the types. */
    certPositive: 19,
    /** 0x30: Certification revocation signature
     *
     * This signature revokes an earlier User ID certification signature
     * (signature class 0x10 through 0x13) or direct-key signature
     * (0x1F).  It should be issued by the same key that issued the
     * revoked signature or an authorized revocation key.  The signature
     * is computed over the same data as the certificate that it
     * revokes, and should have a later creation date than that
     * certificate. */
    certRevocation: 48,
    /** 0x18: Subkey Binding Signature
     *
     * This signature is a statement by the top-level signing key that
     * indicates that it owns the subkey.  This signature is calculated
     * directly on the primary key and subkey, and not on any User ID or
     * other packets.  A signature that binds a signing subkey MUST have
     * an Embedded Signature subpacket in this binding signature that
     * contains a 0x19 signature made by the signing subkey on the
     * primary key and subkey. */
    subkeyBinding: 24,
    /** 0x19: Primary Key Binding Signature
     *
     * This signature is a statement by a signing subkey, indicating
     * that it is owned by the primary key and subkey.  This signature
     * is calculated the same way as a 0x18 signature: directly on the
     * primary key and subkey, and not on any User ID or other packets.
     *
     * When a signature is made over a key, the hash data starts with the
     * octet 0x99, followed by a two-octet length of the key, and then body
     * of the key packet.  (Note that this is an old-style packet header for
     * a key packet with two-octet length.)  A subkey binding signature
     * (type 0x18) or primary key binding signature (type 0x19) then hashes
     * the subkey using the same format as the main key (also using 0x99 as
     * the first octet). */
    keyBinding: 25,
    /** 0x1F: Signature directly on a key
     *
     * This signature is calculated directly on a key.  It binds the
     * information in the Signature subpackets to the key, and is
     * appropriate to be used for subpackets that provide information
     * about the key, such as the Revocation Key subpacket.  It is also
     * appropriate for statements that non-self certifiers want to make
     * about the key itself, rather than the binding between a key and a
     * name. */
    key: 31,
    /** 0x20: Key revocation signature
     *
     * The signature is calculated directly on the key being revoked.  A
     * revoked key is not to be used.  Only revocation signatures by the
     * key being revoked, or by an authorized revocation key, should be
     * considered valid revocation signatures.a */
    keyRevocation: 32,
    /** 0x28: Subkey revocation signature
     *
     * The signature is calculated directly on the subkey being revoked.
     * A revoked subkey is not to be used.  Only revocation signatures
     * by the top-level signature key that is bound to this subkey, or
     * by an authorized revocation key, should be considered valid
     * revocation signatures.
     *
     * Key revocation signatures (types 0x20 and 0x28)
     * hash only the key being revoked. */
    subkeyRevocation: 40,
    /** 0x40: Timestamp signature.
     * This signature is only meaningful for the timestamp contained in
     * it. */
    timestamp: 64,
    /** 0x50: Third-Party Confirmation signature.
     *
     * This signature is a signature over some other OpenPGP Signature
     * packet(s).  It is analogous to a notary seal on the signed data.
     * A third-party signature SHOULD include Signature Target
     * subpacket(s) to give easy identification.  Note that we really do
     * mean SHOULD.  There are plausible uses for this (such as a blind
     * party that only sees the signature, not the key or source
     * document) that cannot include a target subpacket. */
    thirdParty: 80
  },
  /** Signature subpacket type
   * @enum {Integer}
   * @readonly
   */
  signatureSubpacket: {
    signatureCreationTime: 2,
    signatureExpirationTime: 3,
    exportableCertification: 4,
    trustSignature: 5,
    regularExpression: 6,
    revocable: 7,
    keyExpirationTime: 9,
    placeholderBackwardsCompatibility: 10,
    preferredSymmetricAlgorithms: 11,
    revocationKey: 12,
    issuerKeyID: 16,
    notationData: 20,
    preferredHashAlgorithms: 21,
    preferredCompressionAlgorithms: 22,
    keyServerPreferences: 23,
    preferredKeyServer: 24,
    primaryUserID: 25,
    policyURI: 26,
    keyFlags: 27,
    signersUserID: 28,
    reasonForRevocation: 29,
    features: 30,
    signatureTarget: 31,
    embeddedSignature: 32,
    issuerFingerprint: 33,
    preferredAEADAlgorithms: 34,
    preferredCipherSuites: 39
  },
  /** Key flags
   * @enum {Integer}
   * @readonly
   */
  keyFlags: {
    /** 0x01 - This key may be used to certify other keys. */
    certifyKeys: 1,
    /** 0x02 - This key may be used to sign data. */
    signData: 2,
    /** 0x04 - This key may be used to encrypt communications. */
    encryptCommunication: 4,
    /** 0x08 - This key may be used to encrypt storage. */
    encryptStorage: 8,
    /** 0x10 - The private component of this key may have been split
     *        by a secret-sharing mechanism. */
    splitPrivateKey: 16,
    /** 0x20 - This key may be used for authentication. */
    authentication: 32,
    /** 0x80 - The private component of this key may be in the
     *        possession of more than one person. */
    sharedPrivateKey: 128
  },
  /** Armor type
   * @enum {Integer}
   * @readonly
   */
  armor: {
    multipartSection: 0,
    multipartLast: 1,
    signed: 2,
    message: 3,
    publicKey: 4,
    privateKey: 5,
    signature: 6
  },
  /** {@link https://tools.ietf.org/html/rfc4880#section-5.2.3.23|RFC4880, section 5.2.3.23}
   * @enum {Integer}
   * @readonly
   */
  reasonForRevocation: {
    /** No reason specified (key revocations or cert revocations) */
    noReason: 0,
    /** Key is superseded (key revocations) */
    keySuperseded: 1,
    /** Key material has been compromised (key revocations) */
    keyCompromised: 2,
    /** Key is retired and no longer used (key revocations) */
    keyRetired: 3,
    /** User ID information is no longer valid (cert revocations) */
    userIDInvalid: 32
  },
  /** {@link https://tools.ietf.org/html/draft-ietf-openpgp-rfc4880bis-04#section-5.2.3.25|RFC4880bis-04, section 5.2.3.25}
   * @enum {Integer}
   * @readonly
   */
  features: {
    /** 0x01 - Modification Detection (packets 18 and 19) */
    modificationDetection: 1,
    /** 0x02 - AEAD Encrypted Data Packet (packet 20) and version 5
     *         Symmetric-Key Encrypted Session Key Packets (packet 3) */
    aead: 2,
    /** 0x04 - Version 5 Public-Key Packet format and corresponding new
      *        fingerprint format */
    v5Keys: 4,
    seipdv2: 8
  },
  /**
   * Asserts validity of given value and converts from string/integer to integer.
   * @param {Object} type target enum type
   * @param {String|Integer} e value to check and/or convert
   * @returns {Integer} enum value if it exists
   * @throws {Error} if the value is invalid
   */
  write: function(type, e) {
    if (typeof e === "number") {
      e = this.read(type, e);
    }
    if (type[e] !== void 0) {
      return type[e];
    }
    throw new Error("Invalid enum value.");
  },
  /**
   * Converts enum integer value to the corresponding string, if it exists.
   * @param {Object} type target enum type
   * @param {Integer} e value to convert
   * @returns {String} name of enum value if it exists
   * @throws {Error} if the value is invalid
   */
  read: function(type, e) {
    if (!type[byValue]) {
      type[byValue] = [];
      Object.entries(type).forEach(([key, value]) => {
        type[byValue][value] = key;
      });
    }
    if (type[byValue][e] !== void 0) {
      return type[byValue][e];
    }
    throw new Error("Invalid enum value.");
  }
};
var config = {
  /**
   * @memberof module:config
   * @property {Integer} preferredHashAlgorithm Default hash algorithm {@link module:enums.hash}
   */
  preferredHashAlgorithm: enums.hash.sha512,
  /**
   * @memberof module:config
   * @property {Integer} preferredSymmetricAlgorithm Default encryption cipher {@link module:enums.symmetric}
   */
  preferredSymmetricAlgorithm: enums.symmetric.aes256,
  /**
   * @memberof module:config
   * @property {Integer} compression Default compression algorithm {@link module:enums.compression}
   */
  preferredCompressionAlgorithm: enums.compression.uncompressed,
  /**
   * Use Authenticated Encryption with Additional Data (AEAD) protection for symmetric encryption.
   * This option is applicable to:
   * - key generation (encryption key preferences),
   * - password-based message encryption, and
   * - private key encryption.
   * In the case of message encryption using public keys, the encryption key preferences are respected instead.
   * Note: not all OpenPGP implementations are compatible with this option.
   * @see {@link https://tools.ietf.org/html/draft-ietf-openpgp-crypto-refresh-10.html|draft-crypto-refresh-10}
   * @memberof module:config
   * @property {Boolean} aeadProtect
   */
  aeadProtect: false,
  /**
   * When reading OpenPGP v4 private keys (e.g. those generated in OpenPGP.js when not setting `config.v5Keys = true`)
   * which were encrypted by OpenPGP.js v5 (or older) using `config.aeadProtect = true`,
   * this option must be set, otherwise key parsing and/or key decryption will fail.
   * Note: only set this flag if you know that the keys are of the legacy type, as non-legacy keys
   * will be processed incorrectly.
   */
  parseAEADEncryptedV4KeysAsLegacy: false,
  /**
   * Default Authenticated Encryption with Additional Data (AEAD) encryption mode
   * Only has an effect when aeadProtect is set to true.
   * @memberof module:config
   * @property {Integer} preferredAEADAlgorithm Default AEAD mode {@link module:enums.aead}
   */
  preferredAEADAlgorithm: enums.aead.gcm,
  /**
   * Chunk Size Byte for Authenticated Encryption with Additional Data (AEAD) mode
   * Only has an effect when aeadProtect is set to true.
   * Must be an integer value from 0 to 56.
   * @memberof module:config
   * @property {Integer} aeadChunkSizeByte
   */
  aeadChunkSizeByte: 12,
  /**
   * Use v6 keys.
   * Note: not all OpenPGP implementations are compatible with this option.
   * **FUTURE OPENPGP.JS VERSIONS MAY BREAK COMPATIBILITY WHEN USING THIS OPTION**
   * @memberof module:config
   * @property {Boolean} v6Keys
   */
  v6Keys: false,
  /**
   * Enable parsing v5 keys and v5 signatures (which is different from the AEAD-encrypted SEIPDv2 packet).
   * These are non-standard entities, which in the crypto-refresh have been superseded
   * by v6 keys and v6 signatures, respectively.
   * However, generation of v5 entities was supported behind config flag in OpenPGP.js v5, and some other libraries,
   * hence parsing them might be necessary in some cases.
   */
  enableParsingV5Entities: false,
  /**
   * S2K (String to Key) type, used for key derivation in the context of secret key encryption
   * and password-encrypted data. Weaker s2k options are not allowed.
   * Note: Argon2 is the strongest option but not all OpenPGP implementations are compatible with it
   * (pending standardisation).
   * @memberof module:config
   * @property {enums.s2k.argon2|enums.s2k.iterated} s2kType {@link module:enums.s2k}
   */
  s2kType: enums.s2k.iterated,
  /**
   * {@link https://tools.ietf.org/html/rfc4880#section-3.7.1.3| RFC4880 3.7.1.3}:
   * Iteration Count Byte for Iterated and Salted S2K (String to Key).
   * Only relevant if `config.s2kType` is set to `enums.s2k.iterated`.
   * Note: this is the exponent value, not the final number of iterations (refer to specs for more details).
   * @memberof module:config
   * @property {Integer} s2kIterationCountByte
   */
  s2kIterationCountByte: 224,
  /**
   * {@link https://tools.ietf.org/html/draft-ietf-openpgp-crypto-refresh-07.html#section-3.7.1.4| draft-crypto-refresh 3.7.1.4}:
   * Argon2 parameters for S2K (String to Key).
   * Only relevant if `config.s2kType` is set to `enums.s2k.argon2`.
   * Default settings correspond to the second recommendation from RFC9106 ("uniformly safe option"),
   * to ensure compatibility with memory-constrained environments.
   * For more details on the choice of parameters, see https://tools.ietf.org/html/rfc9106#section-4.
   * @memberof module:config
   * @property {Object} params
   * @property {Integer} params.passes - number of iterations t
   * @property {Integer} params.parallelism - degree of parallelism p
   * @property {Integer} params.memoryExponent - one-octet exponent indicating the memory size, which will be: 2**memoryExponent kibibytes.
   */
  s2kArgon2Params: {
    passes: 3,
    parallelism: 4,
    // lanes
    memoryExponent: 16
    // 64 MiB of RAM
  },
  /**
   * Allow decryption of messages without integrity protection.
   * This is an **insecure** setting:
   *  - message modifications cannot be detected, thus processing the decrypted data is potentially unsafe.
   *  - it enables downgrade attacks against integrity-protected messages.
   * @memberof module:config
   * @property {Boolean} allowUnauthenticatedMessages
   */
  allowUnauthenticatedMessages: false,
  /**
   * Allow streaming unauthenticated data before its integrity has been checked. This would allow the application to
   * process large streams while limiting memory usage by releasing the decrypted chunks as soon as possible
   * and deferring checking their integrity until the decrypted stream has been read in full.
   *
   * This setting is **insecure** if the encrypted data has been corrupted by a malicious entity:
   * - if the partially decrypted message is processed further or displayed to the user, it opens up the possibility of attacks such as EFAIL
   *    (see https://efail.de/).
   * - an attacker with access to traces or timing info of internal processing errors could learn some info about the data.
   *
   * NB: this setting does not apply to AEAD-encrypted data, where the AEAD data chunk is never released until integrity is confirmed.
   * @memberof module:config
   * @property {Boolean} allowUnauthenticatedStream
   */
  allowUnauthenticatedStream: false,
  /**
   * Minimum RSA key size allowed for key generation and message signing, verification and encryption.
   * The default is 2047 since due to a bug, previous versions of OpenPGP.js could generate 2047-bit keys instead of 2048-bit ones.
   * @memberof module:config
   * @property {Number} minRSABits
   */
  minRSABits: 2047,
  /**
   * Work-around for rare GPG decryption bug when encrypting with multiple passwords.
   * **Slower and slightly less secure**
   * @memberof module:config
   * @property {Boolean} passwordCollisionCheck
   */
  passwordCollisionCheck: false,
  /**
   * Allow decryption using RSA keys without `encrypt` flag.
   * This setting is potentially insecure, but it is needed to get around an old openpgpjs bug
   * where key flags were ignored when selecting a key for encryption.
   * @memberof module:config
   * @property {Boolean} allowInsecureDecryptionWithSigningKeys
   */
  allowInsecureDecryptionWithSigningKeys: false,
  /**
   * Allow verification of message signatures with keys whose validity at the time of signing cannot be determined.
   * Instead, a verification key will also be consider valid as long as it is valid at the current time.
   * This setting is potentially insecure, but it is needed to verify messages signed with keys that were later reformatted,
   * and have self-signature's creation date that does not match the primary key creation date.
   * @memberof module:config
   * @property {Boolean} allowInsecureDecryptionWithSigningKeys
   */
  allowInsecureVerificationWithReformattedKeys: false,
  /**
   * Allow using keys that do not have any key flags set.
   * Key flags are needed to restrict key usage to specific purposes: for instance, a signing key could only be allowed to certify other keys, and not sign messages
   * (see https://www.ietf.org/archive/id/draft-ietf-openpgp-crypto-refresh-10.html#section-5.2.3.29).
   * Some older keys do not declare any key flags, which means they are not allowed to be used for any operation.
   * This setting allows using such keys for any operation for which they are compatible, based on their public key algorithm.
   */
  allowMissingKeyFlags: false,
  /**
   * Enable constant-time decryption of RSA- and ElGamal-encrypted session keys, to hinder Bleichenbacher-like attacks (https://link.springer.com/chapter/10.1007/BFb0055716).
   * This setting has measurable performance impact and it is only helpful in application scenarios where both of the following conditions apply:
   * - new/incoming messages are automatically decrypted (without user interaction);
   * - an attacker can determine how long it takes to decrypt each message (e.g. due to decryption errors being logged remotely).
   * See also `constantTimePKCS1DecryptionSupportedSymmetricAlgorithms`.
   * @memberof module:config
   * @property {Boolean} constantTimePKCS1Decryption
   */
  constantTimePKCS1Decryption: false,
  /**
   * This setting is only meaningful if `constantTimePKCS1Decryption` is enabled.
   * Decryption of RSA- and ElGamal-encrypted session keys of symmetric algorithms different from the ones specified here will fail.
   * However, the more algorithms are added, the slower the decryption procedure becomes.
   * @memberof module:config
   * @property {Set<Integer>} constantTimePKCS1DecryptionSupportedSymmetricAlgorithms {@link module:enums.symmetric}
   */
  constantTimePKCS1DecryptionSupportedSymmetricAlgorithms: /* @__PURE__ */ new Set([enums.symmetric.aes128, enums.symmetric.aes192, enums.symmetric.aes256]),
  /**
   * @memberof module:config
   * @property {Boolean} ignoreUnsupportedPackets Ignore unsupported/unrecognizable packets on parsing instead of throwing an error
   */
  ignoreUnsupportedPackets: true,
  /**
   * @memberof module:config
   * @property {Boolean} ignoreMalformedPackets Ignore malformed packets on parsing instead of throwing an error
   */
  ignoreMalformedPackets: false,
  /**
   * Parsing of packets is normally restricted to a predefined set of packets. For example a Sym. Encrypted Integrity Protected Data Packet can only
   * contain a certain set of packets including LiteralDataPacket. With this setting we can allow additional packets, which is probably not advisable
   * as a global config setting, but can be used for specific function calls (e.g. decrypt method of Message).
   * @memberof module:config
   * @property {Array} additionalAllowedPackets Allow additional packets on parsing. Defined as array of packet classes, e.g. [PublicKeyPacket]
   */
  additionalAllowedPackets: [],
  /**
   * @memberof module:config
   * @property {Boolean} showVersion Whether to include {@link module:config/config.versionString} in armored messages
   */
  showVersion: false,
  /**
   * @memberof module:config
   * @property {Boolean} showComment Whether to include {@link module:config/config.commentString} in armored messages
   */
  showComment: false,
  /**
   * @memberof module:config
   * @property {String} versionString A version string to be included in armored messages
   */
  versionString: "OpenPGP.js 6.1.0",
  /**
   * @memberof module:config
   * @property {String} commentString A comment string to be included in armored messages
   */
  commentString: "https://openpgpjs.org",
  /**
   * Max userID string length (used for parsing)
   * @memberof module:config
   * @property {Integer} maxUserIDLength
   */
  maxUserIDLength: 1024 * 5,
  /**
   * Contains notatations that are considered "known". Known notations do not trigger
   * validation error when the notation is marked as critical.
   * @memberof module:config
   * @property {Array} knownNotations
   */
  knownNotations: [],
  /**
   * If true, a salt notation is used to randomize signatures generated by v4 and v5 keys (v6 signatures are always non-deterministic, by design).
   * This protects EdDSA signatures from potentially leaking the secret key in case of faults (i.e. bitflips) which, in principle, could occur
   * during the signing computation. It is added to signatures of any algo for simplicity, and as it may also serve as protection in case of
   * weaknesses in the hash algo, potentially hindering e.g. some chosen-prefix attacks.
   * NOTE: the notation is interoperable, but will reveal that the signature has been generated using OpenPGP.js, which may not be desirable in some cases.
   */
  nonDeterministicSignaturesViaNotation: true,
  /**
   * Whether to use the the noble-curves library for curves (other than Curve25519) that are not supported by the available native crypto API.
   * When false, certain standard curves will not be supported (depending on the platform).
   * @memberof module:config
   * @property {Boolean} useEllipticFallback
   */
  useEllipticFallback: true,
  /**
   * Reject insecure hash algorithms
   * @memberof module:config
   * @property {Set<Integer>} rejectHashAlgorithms {@link module:enums.hash}
   */
  rejectHashAlgorithms: /* @__PURE__ */ new Set([enums.hash.md5, enums.hash.ripemd]),
  /**
   * Reject insecure message hash algorithms
   * @memberof module:config
   * @property {Set<Integer>} rejectMessageHashAlgorithms {@link module:enums.hash}
   */
  rejectMessageHashAlgorithms: /* @__PURE__ */ new Set([enums.hash.md5, enums.hash.ripemd, enums.hash.sha1]),
  /**
   * Reject insecure public key algorithms for key generation and message encryption, signing or verification
   * @memberof module:config
   * @property {Set<Integer>} rejectPublicKeyAlgorithms {@link module:enums.publicKey}
   */
  rejectPublicKeyAlgorithms: /* @__PURE__ */ new Set([enums.publicKey.elgamal, enums.publicKey.dsa]),
  /**
   * Reject non-standard curves for key generation, message encryption, signing or verification
   * @memberof module:config
   * @property {Set<String>} rejectCurves {@link module:enums.curve}
   */
  rejectCurves: /* @__PURE__ */ new Set([enums.curve.secp256k1])
};
var debugMode = (() => {
  try {
    return process.env.NODE_ENV === "development";
  } catch (e) {
  }
  return false;
})();
var util = {
  isString: function(data) {
    return typeof data === "string" || data instanceof String;
  },
  nodeRequire: createRequire(import.meta.url),
  isArray: function(data) {
    return data instanceof Array;
  },
  isUint8Array,
  isStream: isStream2,
  /**
   * Load noble-curves lib on demand and return the requested curve function
   * @param {enums.publicKey} publicKeyAlgo
   * @param {enums.curve} [curveName] - for algos supporting different curves (e.g. ECDSA)
   * @returns curve implementation
   * @throws on unrecognized curve, or curve not implemented by noble-curve
   */
  getNobleCurve: async (publicKeyAlgo, curveName) => {
    if (!config.useEllipticFallback) {
      throw new Error("This curve is only supported in the full build of OpenPGP.js");
    }
    const { nobleCurves: nobleCurves2 } = await Promise.resolve().then(function() {
      return noble_curves;
    });
    switch (publicKeyAlgo) {
      case enums.publicKey.ecdh:
      case enums.publicKey.ecdsa: {
        const curve = nobleCurves2.get(curveName);
        if (!curve) throw new Error("Unsupported curve");
        return curve;
      }
      case enums.publicKey.x448:
        return nobleCurves2.get("x448");
      case enums.publicKey.ed448:
        return nobleCurves2.get("ed448");
      default:
        throw new Error("Unsupported curve");
    }
  },
  readNumber: function(bytes2) {
    let n = 0;
    for (let i = 0; i < bytes2.length; i++) {
      n += 256 ** i * bytes2[bytes2.length - 1 - i];
    }
    return n;
  },
  writeNumber: function(n, bytes2) {
    const b = new Uint8Array(bytes2);
    for (let i = 0; i < bytes2; i++) {
      b[i] = n >> 8 * (bytes2 - i - 1) & 255;
    }
    return b;
  },
  readDate: function(bytes2) {
    const n = util.readNumber(bytes2);
    const d = new Date(n * 1e3);
    return d;
  },
  writeDate: function(time) {
    const numeric = Math.floor(time.getTime() / 1e3);
    return util.writeNumber(numeric, 4);
  },
  normalizeDate: function(time = Date.now()) {
    return time === null || time === Infinity ? time : new Date(Math.floor(+time / 1e3) * 1e3);
  },
  /**
   * Read one MPI from bytes in input
   * @param {Uint8Array} bytes - Input data to parse
   * @returns {Uint8Array} Parsed MPI.
   */
  readMPI: function(bytes2) {
    const bits2 = bytes2[0] << 8 | bytes2[1];
    const bytelen = bits2 + 7 >>> 3;
    return util.readExactSubarray(bytes2, 2, 2 + bytelen);
  },
  /**
   * Read exactly `end - start` bytes from input.
   * This is a stricter version of `.subarray`.
   * @param {Uint8Array} input - Input data to parse
   * @returns {Uint8Array} subarray of size always equal to `end - start`
   * @throws if the input array is too short.
   */
  readExactSubarray: function(input, start, end) {
    if (input.length < end - start) {
      throw new Error("Input array too short");
    }
    return input.subarray(start, end);
  },
  /**
   * Left-pad Uint8Array to length by adding 0x0 bytes
   * @param {Uint8Array} bytes - Data to pad
   * @param {Number} length - Padded length
   * @returns {Uint8Array} Padded bytes.
   */
  leftPad(bytes2, length) {
    if (bytes2.length > length) {
      throw new Error("Input array too long");
    }
    const padded = new Uint8Array(length);
    const offset = length - bytes2.length;
    padded.set(bytes2, offset);
    return padded;
  },
  /**
   * Convert a Uint8Array to an MPI-formatted Uint8Array.
   * @param {Uint8Array} bin - An array of 8-bit integers to convert
   * @returns {Uint8Array} MPI-formatted Uint8Array.
   */
  uint8ArrayToMPI: function(bin) {
    const bitSize = util.uint8ArrayBitLength(bin);
    if (bitSize === 0) {
      throw new Error("Zero MPI");
    }
    const stripped = bin.subarray(bin.length - Math.ceil(bitSize / 8));
    const prefix = new Uint8Array([(bitSize & 65280) >> 8, bitSize & 255]);
    return util.concatUint8Array([prefix, stripped]);
  },
  /**
   * Return bit length of the input data
   * @param {Uint8Array} bin input data (big endian)
   * @returns bit length
   */
  uint8ArrayBitLength: function(bin) {
    let i;
    for (i = 0; i < bin.length; i++) if (bin[i] !== 0) break;
    if (i === bin.length) {
      return 0;
    }
    const stripped = bin.subarray(i);
    return (stripped.length - 1) * 8 + util.nbits(stripped[0]);
  },
  /**
   * Convert a hex string to an array of 8-bit integers
   * @param {String} hex - A hex string to convert
   * @returns {Uint8Array} An array of 8-bit integers.
   */
  hexToUint8Array: function(hex) {
    const result = new Uint8Array(hex.length >> 1);
    for (let k = 0; k < hex.length >> 1; k++) {
      result[k] = parseInt(hex.substr(k << 1, 2), 16);
    }
    return result;
  },
  /**
   * Convert an array of 8-bit integers to a hex string
   * @param {Uint8Array} bytes - Array of 8-bit integers to convert
   * @returns {String} Hexadecimal representation of the array.
   */
  uint8ArrayToHex: function(bytes2) {
    const hexAlphabet = "0123456789abcdef";
    let s = "";
    bytes2.forEach((v) => {
      s += hexAlphabet[v >> 4] + hexAlphabet[v & 15];
    });
    return s;
  },
  /**
   * Convert a string to an array of 8-bit integers
   * @param {String} str - String to convert
   * @returns {Uint8Array} An array of 8-bit integers.
   */
  stringToUint8Array: function(str) {
    return transform(str, (str2) => {
      if (!util.isString(str2)) {
        throw new Error("stringToUint8Array: Data must be in the form of a string");
      }
      const result = new Uint8Array(str2.length);
      for (let i = 0; i < str2.length; i++) {
        result[i] = str2.charCodeAt(i);
      }
      return result;
    });
  },
  /**
   * Convert an array of 8-bit integers to a string
   * @param {Uint8Array} bytes - An array of 8-bit integers to convert
   * @returns {String} String representation of the array.
   */
  uint8ArrayToString: function(bytes2) {
    bytes2 = new Uint8Array(bytes2);
    const result = [];
    const bs = 1 << 14;
    const j = bytes2.length;
    for (let i = 0; i < j; i += bs) {
      result.push(String.fromCharCode.apply(String, bytes2.subarray(i, i + bs < j ? i + bs : j)));
    }
    return result.join("");
  },
  /**
   * Convert a native javascript string to a Uint8Array of utf8 bytes
   * @param {String|ReadableStream} str - The string to convert
   * @returns {Uint8Array|ReadableStream} A valid squence of utf8 bytes.
   */
  encodeUTF8: function(str) {
    const encoder = new TextEncoder("utf-8");
    function process2(value, lastChunk = false) {
      return encoder.encode(value, { stream: !lastChunk });
    }
    return transform(str, process2, () => process2("", true));
  },
  /**
   * Convert a Uint8Array of utf8 bytes to a native javascript string
   * @param {Uint8Array|ReadableStream} utf8 - A valid squence of utf8 bytes
   * @returns {String|ReadableStream} A native javascript string.
   */
  decodeUTF8: function(utf8) {
    const decoder = new TextDecoder("utf-8");
    function process2(value, lastChunk = false) {
      return decoder.decode(value, { stream: !lastChunk });
    }
    return transform(utf8, process2, () => process2(new Uint8Array(), true));
  },
  /**
   * Concat a list of Uint8Arrays, Strings or Streams
   * The caller must not mix Uint8Arrays with Strings, but may mix Streams with non-Streams.
   * @param {Array<Uint8Array|String|ReadableStream>} Array - Of Uint8Arrays/Strings/Streams to concatenate
   * @returns {Uint8Array|String|ReadableStream} Concatenated array.
   */
  concat,
  /**
   * Concat Uint8Arrays
   * @param {Array<Uint8Array>} Array - Of Uint8Arrays to concatenate
   * @returns {Uint8Array} Concatenated array.
   */
  concatUint8Array,
  /**
   * Check Uint8Array equality
   * @param {Uint8Array} array1 - First array
   * @param {Uint8Array} array2 - Second array
   * @returns {Boolean} Equality.
   */
  equalsUint8Array: function(array1, array2) {
    if (!util.isUint8Array(array1) || !util.isUint8Array(array2)) {
      throw new Error("Data must be in the form of a Uint8Array");
    }
    if (array1.length !== array2.length) {
      return false;
    }
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false;
      }
    }
    return true;
  },
  /**
   * Calculates a 16bit sum of a Uint8Array by adding each character
   * codes modulus 65535
   * @param {Uint8Array} Uint8Array - To create a sum of
   * @returns {Uint8Array} 2 bytes containing the sum of all charcodes % 65535.
   */
  writeChecksum: function(text) {
    let s = 0;
    for (let i = 0; i < text.length; i++) {
      s = s + text[i] & 65535;
    }
    return util.writeNumber(s, 2);
  },
  /**
   * Helper function to print a debug message. Debug
   * messages are only printed if
   * @param {String} str - String of the debug message
   */
  printDebug: function(str) {
    if (debugMode) {
      console.log("[OpenPGP.js debug]", str);
    }
  },
  /**
   * Helper function to print a debug error. Debug
   * messages are only printed if
   * @param {String} str - String of the debug message
   */
  printDebugError: function(error) {
    if (debugMode) {
      console.error("[OpenPGP.js debug]", error);
    }
  },
  // returns bit length of the integer x
  nbits: function(x) {
    let r = 1;
    let t = x >>> 16;
    if (t !== 0) {
      x = t;
      r += 16;
    }
    t = x >> 8;
    if (t !== 0) {
      x = t;
      r += 8;
    }
    t = x >> 4;
    if (t !== 0) {
      x = t;
      r += 4;
    }
    t = x >> 2;
    if (t !== 0) {
      x = t;
      r += 2;
    }
    t = x >> 1;
    if (t !== 0) {
      x = t;
      r += 1;
    }
    return r;
  },
  /**
   * If S[1] == 0, then double(S) == (S[2..128] || 0);
   * otherwise, double(S) == (S[2..128] || 0) xor
   * (zeros(120) || 10000111).
   *
   * Both OCB and EAX (through CMAC) require this function to be constant-time.
   *
   * @param {Uint8Array} data
   */
  double: function(data) {
    const doubleVar = new Uint8Array(data.length);
    const last = data.length - 1;
    for (let i = 0; i < last; i++) {
      doubleVar[i] = data[i] << 1 ^ data[i + 1] >> 7;
    }
    doubleVar[last] = data[last] << 1 ^ (data[0] >> 7) * 135;
    return doubleVar;
  },
  /**
   * Shift a Uint8Array to the right by n bits
   * @param {Uint8Array} array - The array to shift
   * @param {Integer} bits - Amount of bits to shift (MUST be smaller
   * than 8)
   * @returns {String} Resulting array.
   */
  shiftRight: function(array, bits2) {
    if (bits2) {
      for (let i = array.length - 1; i >= 0; i--) {
        array[i] >>= bits2;
        if (i > 0) {
          array[i] |= array[i - 1] << 8 - bits2;
        }
      }
    }
    return array;
  },
  /**
   * Get native Web Cryptography API.
   * @returns {Object} The SubtleCrypto API
   * @throws if the API is not available
   */
  getWebCrypto: function() {
    const globalWebCrypto = typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle;
    const webCrypto2 = globalWebCrypto || this.getNodeCrypto()?.webcrypto.subtle;
    if (!webCrypto2) {
      throw new Error("The WebCrypto API is not available");
    }
    return webCrypto2;
  },
  /**
   * Get native Node.js crypto api.
   * @returns {Object} The crypto module or 'undefined'.
   */
  getNodeCrypto: function() {
    return this.nodeRequire("crypto");
  },
  getNodeZlib: function() {
    return this.nodeRequire("zlib");
  },
  /**
   * Get native Node.js Buffer constructor. This should be used since
   * Buffer is not available under browserify.
   * @returns {Function} The Buffer constructor or 'undefined'.
   */
  getNodeBuffer: function() {
    return (this.nodeRequire("buffer") || {}).Buffer;
  },
  getHardwareConcurrency: function() {
    if (typeof navigator !== "undefined") {
      return navigator.hardwareConcurrency || 1;
    }
    const os2 = this.nodeRequire("os");
    return os2.cpus().length;
  },
  /**
   * Test email format to ensure basic compliance:
   * - must include a single @
   * - no control or space unicode chars allowed
   * - no backslash and square brackets (as the latter can mess with the userID parsing)
   * - cannot end with a punctuation char
   * These checks are not meant to be exhaustive; applications are strongly encouraged to implement stricter validation,
   * e.g. based on the W3C HTML spec (https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)).
   */
  isEmailAddress: function(data) {
    if (!util.isString(data)) {
      return false;
    }
    const re = /^[^\p{C}\p{Z}@<>\\]+@[^\p{C}\p{Z}@<>\\]+[^\p{C}\p{Z}\p{P}]$/u;
    return re.test(data);
  },
  /**
   * Normalize line endings to <CR><LF>
   * Support any encoding where CR=0x0D, LF=0x0A
   */
  canonicalizeEOL: function(data) {
    const CR = 13;
    const LF = 10;
    let carryOverCR = false;
    return transform(data, (bytes2) => {
      if (carryOverCR) {
        bytes2 = util.concatUint8Array([new Uint8Array([CR]), bytes2]);
      }
      if (bytes2[bytes2.length - 1] === CR) {
        carryOverCR = true;
        bytes2 = bytes2.subarray(0, -1);
      } else {
        carryOverCR = false;
      }
      let index2;
      const indices = [];
      for (let i = 0; ; i = index2) {
        index2 = bytes2.indexOf(LF, i) + 1;
        if (index2) {
          if (bytes2[index2 - 2] !== CR) indices.push(index2);
        } else {
          break;
        }
      }
      if (!indices.length) {
        return bytes2;
      }
      const normalized = new Uint8Array(bytes2.length + indices.length);
      let j = 0;
      for (let i = 0; i < indices.length; i++) {
        const sub = bytes2.subarray(indices[i - 1] || 0, indices[i]);
        normalized.set(sub, j);
        j += sub.length;
        normalized[j - 1] = CR;
        normalized[j] = LF;
        j++;
      }
      normalized.set(bytes2.subarray(indices[indices.length - 1] || 0), j);
      return normalized;
    }, () => carryOverCR ? new Uint8Array([CR]) : void 0);
  },
  /**
   * Convert line endings from canonicalized <CR><LF> to native <LF>
   * Support any encoding where CR=0x0D, LF=0x0A
   */
  nativeEOL: function(data) {
    const CR = 13;
    const LF = 10;
    let carryOverCR = false;
    return transform(data, (bytes2) => {
      if (carryOverCR && bytes2[0] !== LF) {
        bytes2 = util.concatUint8Array([new Uint8Array([CR]), bytes2]);
      } else {
        bytes2 = new Uint8Array(bytes2);
      }
      if (bytes2[bytes2.length - 1] === CR) {
        carryOverCR = true;
        bytes2 = bytes2.subarray(0, -1);
      } else {
        carryOverCR = false;
      }
      let index2;
      let j = 0;
      for (let i = 0; i !== bytes2.length; i = index2) {
        index2 = bytes2.indexOf(CR, i) + 1;
        if (!index2) index2 = bytes2.length;
        const last = index2 - (bytes2[index2] === LF ? 1 : 0);
        if (i) bytes2.copyWithin(j, i, last);
        j += last - i;
      }
      return bytes2.subarray(0, j);
    }, () => carryOverCR ? new Uint8Array([CR]) : void 0);
  },
  /**
   * Remove trailing spaces, carriage returns and tabs from each line
   */
  removeTrailingSpaces: function(text) {
    return text.split("\n").map((line) => {
      let i = line.length - 1;
      for (; i >= 0 && (line[i] === " " || line[i] === "	" || line[i] === "\r"); i--) ;
      return line.substr(0, i + 1);
    }).join("\n");
  },
  wrapError: function(message, error) {
    if (!error) {
      return new Error(message);
    }
    try {
      error.message = message + ": " + error.message;
    } catch (e) {
    }
    return error;
  },
  /**
   * Map allowed packet tags to corresponding classes
   * Meant to be used to format `allowedPacket` for Packetlist.read
   * @param {Array<Object>} allowedClasses
   * @returns {Object} map from enum.packet to corresponding *Packet class
   */
  constructAllowedPackets: function(allowedClasses) {
    const map = {};
    allowedClasses.forEach((PacketClass) => {
      if (!PacketClass.tag) {
        throw new Error("Invalid input: expected a packet class");
      }
      map[PacketClass.tag] = PacketClass;
    });
    return map;
  },
  /**
   * Return a Promise that will resolve as soon as one of the promises in input resolves
   * or will reject if all input promises all rejected
   * (similar to Promise.any, but with slightly different error handling)
   * @param {Array<Promise>} promises
   * @return {Promise<Any>} Promise resolving to the result of the fastest fulfilled promise
   *                          or rejected with the Error of the last resolved Promise (if all promises are rejected)
   */
  anyPromise: function(promises) {
    return new Promise(async (resolve2, reject) => {
      let exception;
      await Promise.all(promises.map(async (promise) => {
        try {
          resolve2(await promise);
        } catch (e) {
          exception = e;
        }
      }));
      reject(exception);
    });
  },
  /**
   * Return either `a` or `b` based on `cond`, in algorithmic constant time.
   * @param {Boolean} cond
   * @param {Uint8Array} a
   * @param {Uint8Array} b
   * @returns `a` if `cond` is true, `b` otherwise
   */
  selectUint8Array: function(cond, a, b) {
    const length = Math.max(a.length, b.length);
    const result = new Uint8Array(length);
    let end = 0;
    for (let i = 0; i < result.length; i++) {
      result[i] = a[i] & 256 - cond | b[i] & 255 + cond;
      end += cond & i < a.length | 1 - cond & i < b.length;
    }
    return result.subarray(0, end);
  },
  /**
   * Return either `a` or `b` based on `cond`, in algorithmic constant time.
   * NB: it only supports `a, b` with values between 0-255.
   * @param {Boolean} cond
   * @param {Uint8} a
   * @param {Uint8} b
   * @returns `a` if `cond` is true, `b` otherwise
   */
  selectUint8: function(cond, a, b) {
    return a & 256 - cond | b & 255 + cond;
  },
  /**
   * @param {module:enums.symmetric} cipherAlgo
   */
  isAES: function(cipherAlgo) {
    return cipherAlgo === enums.symmetric.aes128 || cipherAlgo === enums.symmetric.aes192 || cipherAlgo === enums.symmetric.aes256;
  }
};
var Buffer$3 = util.getNodeBuffer();
var encodeChunk;
var decodeChunk;
if (Buffer$3) {
  encodeChunk = (buf) => Buffer$3.from(buf).toString("base64");
  decodeChunk = (str) => {
    const b = Buffer$3.from(str, "base64");
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  };
} else {
  encodeChunk = (buf) => btoa(util.uint8ArrayToString(buf));
  decodeChunk = (str) => util.stringToUint8Array(atob(str));
}
function encode$1(data) {
  let buf = new Uint8Array();
  return transform(data, (value) => {
    buf = util.concatUint8Array([buf, value]);
    const r = [];
    const bytesPerLine = 45;
    const lines = Math.floor(buf.length / bytesPerLine);
    const bytes2 = lines * bytesPerLine;
    const encoded = encodeChunk(buf.subarray(0, bytes2));
    for (let i = 0; i < lines; i++) {
      r.push(encoded.substr(i * 60, 60));
      r.push("\n");
    }
    buf = buf.subarray(bytes2);
    return r.join("");
  }, () => buf.length ? encodeChunk(buf) + "\n" : "");
}
function decode$2(data) {
  let buf = "";
  return transform(data, (value) => {
    buf += value;
    let spaces = 0;
    const spacechars = [" ", "	", "\r", "\n"];
    for (let i = 0; i < spacechars.length; i++) {
      const spacechar = spacechars[i];
      for (let pos2 = buf.indexOf(spacechar); pos2 !== -1; pos2 = buf.indexOf(spacechar, pos2 + 1)) {
        spaces++;
      }
    }
    let length = buf.length;
    for (; length > 0 && (length - spaces) % 4 !== 0; length--) {
      if (spacechars.includes(buf[length])) spaces--;
    }
    const decoded = decodeChunk(buf.substr(0, length));
    buf = buf.substr(length);
    return decoded;
  }, () => decodeChunk(buf));
}
function b64ToUint8Array(base64) {
  return decode$2(base64.replace(/-/g, "+").replace(/_/g, "/"));
}
function uint8ArrayToB64(bytes2, url) {
  let encoded = encode$1(bytes2).replace(/[\r\n]/g, "");
  {
    encoded = encoded.replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/[=]/g, "");
  }
  return encoded;
}
function getType2(text) {
  const reHeader = /^-----BEGIN PGP (MESSAGE, PART \d+\/\d+|MESSAGE, PART \d+|SIGNED MESSAGE|MESSAGE|PUBLIC KEY BLOCK|PRIVATE KEY BLOCK|SIGNATURE)-----$/m;
  const header = text.match(reHeader);
  if (!header) {
    throw new Error("Unknown ASCII armor type");
  }
  if (/MESSAGE, PART \d+\/\d+/.test(header[1])) {
    return enums.armor.multipartSection;
  }
  if (/MESSAGE, PART \d+/.test(header[1])) {
    return enums.armor.multipartLast;
  }
  if (/SIGNED MESSAGE/.test(header[1])) {
    return enums.armor.signed;
  }
  if (/MESSAGE/.test(header[1])) {
    return enums.armor.message;
  }
  if (/PUBLIC KEY BLOCK/.test(header[1])) {
    return enums.armor.publicKey;
  }
  if (/PRIVATE KEY BLOCK/.test(header[1])) {
    return enums.armor.privateKey;
  }
  if (/SIGNATURE/.test(header[1])) {
    return enums.armor.signature;
  }
}
function addheader(customComment, config2) {
  let result = "";
  if (config2.showVersion) {
    result += "Version: " + config2.versionString + "\n";
  }
  if (config2.showComment) {
    result += "Comment: " + config2.commentString + "\n";
  }
  if (customComment) {
    result += "Comment: " + customComment + "\n";
  }
  result += "\n";
  return result;
}
function getCheckSum(data) {
  const crc = createcrc24(data);
  return encode$1(crc);
}
var crc_table = [
  new Array(255),
  new Array(255),
  new Array(255),
  new Array(255)
];
for (let i = 0; i <= 255; i++) {
  let crc = i << 16;
  for (let j = 0; j < 8; j++) {
    crc = crc << 1 ^ ((crc & 8388608) !== 0 ? 8801531 : 0);
  }
  crc_table[0][i] = (crc & 16711680) >> 16 | crc & 65280 | (crc & 255) << 16;
}
for (let i = 0; i <= 255; i++) {
  crc_table[1][i] = crc_table[0][i] >> 8 ^ crc_table[0][crc_table[0][i] & 255];
}
for (let i = 0; i <= 255; i++) {
  crc_table[2][i] = crc_table[1][i] >> 8 ^ crc_table[0][crc_table[1][i] & 255];
}
for (let i = 0; i <= 255; i++) {
  crc_table[3][i] = crc_table[2][i] >> 8 ^ crc_table[0][crc_table[2][i] & 255];
}
var isLittleEndian$1 = function() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(
    0,
    255,
    true
    /* littleEndian */
  );
  return new Int16Array(buffer)[0] === 255;
}();
function createcrc24(input) {
  let crc = 13501623;
  return transform(input, (value) => {
    const len32 = isLittleEndian$1 ? Math.floor(value.length / 4) : 0;
    const arr32 = new Uint32Array(value.buffer, value.byteOffset, len32);
    for (let i = 0; i < len32; i++) {
      crc ^= arr32[i];
      crc = crc_table[0][crc >> 24 & 255] ^ crc_table[1][crc >> 16 & 255] ^ crc_table[2][crc >> 8 & 255] ^ crc_table[3][crc >> 0 & 255];
    }
    for (let i = len32 * 4; i < value.length; i++) {
      crc = crc >> 8 ^ crc_table[0][crc & 255 ^ value[i]];
    }
  }, () => new Uint8Array([crc, crc >> 8, crc >> 16]));
}
function verifyHeaders$1(headers) {
  for (let i = 0; i < headers.length; i++) {
    if (!/^([^\s:]|[^\s:][^:]*[^\s:]): .+$/.test(headers[i])) {
      util.printDebugError(new Error("Improperly formatted armor header: " + headers[i]));
    }
    if (!/^(Version|Comment|MessageID|Hash|Charset): .+$/.test(headers[i])) {
      util.printDebugError(new Error("Unknown header: " + headers[i]));
    }
  }
}
function removeChecksum(text) {
  let body = text;
  const lastEquals = text.lastIndexOf("=");
  if (lastEquals >= 0 && lastEquals !== text.length - 1) {
    body = text.slice(0, lastEquals);
  }
  return body;
}
function unarmor(input) {
  return new Promise(async (resolve2, reject) => {
    try {
      const reSplit = /^-----[^-]+-----$/m;
      const reEmptyLine = /^[ \f\r\t\u00a0\u2000-\u200a\u202f\u205f\u3000]*$/;
      let type;
      const headers = [];
      let lastHeaders = headers;
      let headersDone;
      let text = [];
      let textDone;
      const data = decode$2(transformPair(input, async (readable, writable) => {
        const reader = getReader(readable);
        try {
          while (true) {
            let line = await reader.readLine();
            if (line === void 0) {
              throw new Error("Misformed armored text");
            }
            line = util.removeTrailingSpaces(line.replace(/[\r\n]/g, ""));
            if (!type) {
              if (reSplit.test(line)) {
                type = getType2(line);
              }
            } else if (!headersDone) {
              if (reSplit.test(line)) {
                reject(new Error("Mandatory blank line missing between armor headers and armor data"));
              }
              if (!reEmptyLine.test(line)) {
                lastHeaders.push(line);
              } else {
                verifyHeaders$1(lastHeaders);
                headersDone = true;
                if (textDone || type !== enums.armor.signed) {
                  resolve2({ text, data, headers, type });
                  break;
                }
              }
            } else if (!textDone && type === enums.armor.signed) {
              if (!reSplit.test(line)) {
                text.push(line.replace(/^- /, ""));
              } else {
                text = text.join("\r\n");
                textDone = true;
                verifyHeaders$1(lastHeaders);
                lastHeaders = [];
                headersDone = false;
              }
            }
          }
        } catch (e) {
          reject(e);
          return;
        }
        const writer = getWriter(writable);
        try {
          while (true) {
            await writer.ready;
            const { done, value } = await reader.read();
            if (done) {
              throw new Error("Misformed armored text");
            }
            const line = value + "";
            if (line.indexOf("=") === -1 && line.indexOf("-") === -1) {
              await writer.write(line);
            } else {
              let remainder = await reader.readToEnd();
              if (!remainder.length) remainder = "";
              remainder = line + remainder;
              remainder = util.removeTrailingSpaces(remainder.replace(/\r/g, ""));
              const parts = remainder.split(reSplit);
              if (parts.length === 1) {
                throw new Error("Misformed armored text");
              }
              const body = removeChecksum(parts[0].slice(0, -1));
              await writer.write(body);
              break;
            }
          }
          await writer.ready;
          await writer.close();
        } catch (e) {
          await writer.abort(e);
        }
      }));
    } catch (e) {
      reject(e);
    }
  }).then(async (result) => {
    if (isArrayStream(result.data)) {
      result.data = await readToEnd(result.data);
    }
    return result;
  });
}
function armor(messageType, body, partIndex, partTotal, customComment, emitChecksum = false, config$1 = config) {
  let text;
  let hash2;
  if (messageType === enums.armor.signed) {
    text = body.text;
    hash2 = body.hash;
    body = body.data;
  }
  const maybeBodyClone = emitChecksum && passiveClone(body);
  const result = [];
  switch (messageType) {
    case enums.armor.multipartSection:
      result.push("-----BEGIN PGP MESSAGE, PART " + partIndex + "/" + partTotal + "-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP MESSAGE, PART " + partIndex + "/" + partTotal + "-----\n");
      break;
    case enums.armor.multipartLast:
      result.push("-----BEGIN PGP MESSAGE, PART " + partIndex + "-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP MESSAGE, PART " + partIndex + "-----\n");
      break;
    case enums.armor.signed:
      result.push("-----BEGIN PGP SIGNED MESSAGE-----\n");
      result.push(hash2 ? `Hash: ${hash2}

` : "\n");
      result.push(text.replace(/^-/mg, "- -"));
      result.push("\n-----BEGIN PGP SIGNATURE-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP SIGNATURE-----\n");
      break;
    case enums.armor.message:
      result.push("-----BEGIN PGP MESSAGE-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP MESSAGE-----\n");
      break;
    case enums.armor.publicKey:
      result.push("-----BEGIN PGP PUBLIC KEY BLOCK-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP PUBLIC KEY BLOCK-----\n");
      break;
    case enums.armor.privateKey:
      result.push("-----BEGIN PGP PRIVATE KEY BLOCK-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP PRIVATE KEY BLOCK-----\n");
      break;
    case enums.armor.signature:
      result.push("-----BEGIN PGP SIGNATURE-----\n");
      result.push(addheader(customComment, config$1));
      result.push(encode$1(body));
      maybeBodyClone && result.push("=", getCheckSum(maybeBodyClone));
      result.push("-----END PGP SIGNATURE-----\n");
      break;
  }
  return util.concat(result);
}
var _0n$8 = BigInt(0);
var _1n$d = BigInt(1);
function uint8ArrayToBigInt(bytes2) {
  const hexAlphabet = "0123456789ABCDEF";
  let s = "";
  bytes2.forEach((v) => {
    s += hexAlphabet[v >> 4] + hexAlphabet[v & 15];
  });
  return BigInt("0x0" + s);
}
function mod$1(a, m) {
  const reduced = a % m;
  return reduced < _0n$8 ? reduced + m : reduced;
}
function modExp(b, e, n) {
  if (n === _0n$8)
    throw Error("Modulo cannot be zero");
  if (n === _1n$d)
    return BigInt(0);
  if (e < _0n$8)
    throw Error("Unsopported negative exponent");
  let exp = e;
  let x = b;
  x %= n;
  let r = BigInt(1);
  while (exp > _0n$8) {
    const lsb = exp & _1n$d;
    exp >>= _1n$d;
    const rx = r * x % n;
    r = lsb ? rx : r;
    x = x * x % n;
  }
  return r;
}
function abs(x) {
  return x >= _0n$8 ? x : -x;
}
function _egcd(aInput, bInput) {
  let x = BigInt(0);
  let y = BigInt(1);
  let xPrev = BigInt(1);
  let yPrev = BigInt(0);
  let a = abs(aInput);
  let b = abs(bInput);
  const aNegated = aInput < _0n$8;
  const bNegated = bInput < _0n$8;
  while (b !== _0n$8) {
    const q = a / b;
    let tmp = x;
    x = xPrev - q * x;
    xPrev = tmp;
    tmp = y;
    y = yPrev - q * y;
    yPrev = tmp;
    tmp = b;
    b = a % b;
    a = tmp;
  }
  return {
    x: aNegated ? -xPrev : xPrev,
    y: bNegated ? -yPrev : yPrev,
    gcd: a
  };
}
function modInv(a, n) {
  const { gcd: gcd2, x } = _egcd(a, n);
  if (gcd2 !== _1n$d) {
    throw new Error("Inverse does not exist");
  }
  return mod$1(x + n, n);
}
function gcd(aInput, bInput) {
  let a = aInput;
  let b = bInput;
  while (b !== _0n$8) {
    const tmp = b;
    b = a % b;
    a = tmp;
  }
  return a;
}
function bigIntToNumber(x) {
  const number2 = Number(x);
  if (number2 > Number.MAX_SAFE_INTEGER) {
    throw new Error("Number can only safely store up to 53 bits");
  }
  return number2;
}
function getBit(x, i) {
  const bit = x >> BigInt(i) & _1n$d;
  return bit === _0n$8 ? 0 : 1;
}
function bitLength(x) {
  const target = x < _0n$8 ? BigInt(-1) : _0n$8;
  let bitlen = 1;
  let tmp = x;
  while ((tmp >>= _1n$d) !== target) {
    bitlen++;
  }
  return bitlen;
}
function byteLength(x) {
  const target = x < _0n$8 ? BigInt(-1) : _0n$8;
  const _8n2 = BigInt(8);
  let len = 1;
  let tmp = x;
  while ((tmp >>= _8n2) !== target) {
    len++;
  }
  return len;
}
function bigIntToUint8Array(x, endian = "be", length) {
  let hex = x.toString(16);
  if (hex.length % 2 === 1) {
    hex = "0" + hex;
  }
  const rawLength = hex.length / 2;
  const bytes2 = new Uint8Array(length || rawLength);
  const offset = length ? length - rawLength : 0;
  let i = 0;
  while (i < rawLength) {
    bytes2[i + offset] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
    i++;
  }
  if (endian !== "be") {
    bytes2.reverse();
  }
  return bytes2;
}
var nodeCrypto$9 = util.getNodeCrypto();
function getRandomBytes(length) {
  const webcrypto2 = typeof crypto !== "undefined" ? crypto : nodeCrypto$9?.webcrypto;
  if (webcrypto2?.getRandomValues) {
    const buf = new Uint8Array(length);
    return webcrypto2.getRandomValues(buf);
  } else {
    throw new Error("No secure random number generator available.");
  }
}
function getRandomBigInteger(min, max2) {
  if (max2 < min) {
    throw new Error("Illegal parameter value: max <= min");
  }
  const modulus = max2 - min;
  const bytes2 = byteLength(modulus);
  const r = uint8ArrayToBigInt(getRandomBytes(bytes2 + 8));
  return mod$1(r, modulus) + min;
}
var _1n$c = BigInt(1);
function randomProbablePrime(bits2, e, k) {
  const _30n = BigInt(30);
  const min = _1n$c << BigInt(bits2 - 1);
  const adds = [1, 6, 5, 4, 3, 2, 1, 4, 3, 2, 1, 2, 1, 4, 3, 2, 1, 2, 1, 4, 3, 2, 1, 6, 5, 4, 3, 2, 1, 2];
  let n = getRandomBigInteger(min, min << _1n$c);
  let i = bigIntToNumber(mod$1(n, _30n));
  do {
    n += BigInt(adds[i]);
    i = (i + adds[i]) % adds.length;
    if (bitLength(n) > bits2) {
      n = mod$1(n, min << _1n$c);
      n += min;
      i = bigIntToNumber(mod$1(n, _30n));
    }
  } while (!isProbablePrime(n, e, k));
  return n;
}
function isProbablePrime(n, e, k) {
  if (e && gcd(n - _1n$c, e) !== _1n$c) {
    return false;
  }
  if (!divisionTest(n)) {
    return false;
  }
  if (!fermat(n)) {
    return false;
  }
  if (!millerRabin(n, k)) {
    return false;
  }
  return true;
}
function fermat(n, b = BigInt(2)) {
  return modExp(b, n - _1n$c, n) === _1n$c;
}
function divisionTest(n) {
  const _0n2 = BigInt(0);
  return smallPrimes.every((m) => mod$1(n, m) !== _0n2);
}
var smallPrimes = [
  7,
  11,
  13,
  17,
  19,
  23,
  29,
  31,
  37,
  41,
  43,
  47,
  53,
  59,
  61,
  67,
  71,
  73,
  79,
  83,
  89,
  97,
  101,
  103,
  107,
  109,
  113,
  127,
  131,
  137,
  139,
  149,
  151,
  157,
  163,
  167,
  173,
  179,
  181,
  191,
  193,
  197,
  199,
  211,
  223,
  227,
  229,
  233,
  239,
  241,
  251,
  257,
  263,
  269,
  271,
  277,
  281,
  283,
  293,
  307,
  311,
  313,
  317,
  331,
  337,
  347,
  349,
  353,
  359,
  367,
  373,
  379,
  383,
  389,
  397,
  401,
  409,
  419,
  421,
  431,
  433,
  439,
  443,
  449,
  457,
  461,
  463,
  467,
  479,
  487,
  491,
  499,
  503,
  509,
  521,
  523,
  541,
  547,
  557,
  563,
  569,
  571,
  577,
  587,
  593,
  599,
  601,
  607,
  613,
  617,
  619,
  631,
  641,
  643,
  647,
  653,
  659,
  661,
  673,
  677,
  683,
  691,
  701,
  709,
  719,
  727,
  733,
  739,
  743,
  751,
  757,
  761,
  769,
  773,
  787,
  797,
  809,
  811,
  821,
  823,
  827,
  829,
  839,
  853,
  857,
  859,
  863,
  877,
  881,
  883,
  887,
  907,
  911,
  919,
  929,
  937,
  941,
  947,
  953,
  967,
  971,
  977,
  983,
  991,
  997,
  1009,
  1013,
  1019,
  1021,
  1031,
  1033,
  1039,
  1049,
  1051,
  1061,
  1063,
  1069,
  1087,
  1091,
  1093,
  1097,
  1103,
  1109,
  1117,
  1123,
  1129,
  1151,
  1153,
  1163,
  1171,
  1181,
  1187,
  1193,
  1201,
  1213,
  1217,
  1223,
  1229,
  1231,
  1237,
  1249,
  1259,
  1277,
  1279,
  1283,
  1289,
  1291,
  1297,
  1301,
  1303,
  1307,
  1319,
  1321,
  1327,
  1361,
  1367,
  1373,
  1381,
  1399,
  1409,
  1423,
  1427,
  1429,
  1433,
  1439,
  1447,
  1451,
  1453,
  1459,
  1471,
  1481,
  1483,
  1487,
  1489,
  1493,
  1499,
  1511,
  1523,
  1531,
  1543,
  1549,
  1553,
  1559,
  1567,
  1571,
  1579,
  1583,
  1597,
  1601,
  1607,
  1609,
  1613,
  1619,
  1621,
  1627,
  1637,
  1657,
  1663,
  1667,
  1669,
  1693,
  1697,
  1699,
  1709,
  1721,
  1723,
  1733,
  1741,
  1747,
  1753,
  1759,
  1777,
  1783,
  1787,
  1789,
  1801,
  1811,
  1823,
  1831,
  1847,
  1861,
  1867,
  1871,
  1873,
  1877,
  1879,
  1889,
  1901,
  1907,
  1913,
  1931,
  1933,
  1949,
  1951,
  1973,
  1979,
  1987,
  1993,
  1997,
  1999,
  2003,
  2011,
  2017,
  2027,
  2029,
  2039,
  2053,
  2063,
  2069,
  2081,
  2083,
  2087,
  2089,
  2099,
  2111,
  2113,
  2129,
  2131,
  2137,
  2141,
  2143,
  2153,
  2161,
  2179,
  2203,
  2207,
  2213,
  2221,
  2237,
  2239,
  2243,
  2251,
  2267,
  2269,
  2273,
  2281,
  2287,
  2293,
  2297,
  2309,
  2311,
  2333,
  2339,
  2341,
  2347,
  2351,
  2357,
  2371,
  2377,
  2381,
  2383,
  2389,
  2393,
  2399,
  2411,
  2417,
  2423,
  2437,
  2441,
  2447,
  2459,
  2467,
  2473,
  2477,
  2503,
  2521,
  2531,
  2539,
  2543,
  2549,
  2551,
  2557,
  2579,
  2591,
  2593,
  2609,
  2617,
  2621,
  2633,
  2647,
  2657,
  2659,
  2663,
  2671,
  2677,
  2683,
  2687,
  2689,
  2693,
  2699,
  2707,
  2711,
  2713,
  2719,
  2729,
  2731,
  2741,
  2749,
  2753,
  2767,
  2777,
  2789,
  2791,
  2797,
  2801,
  2803,
  2819,
  2833,
  2837,
  2843,
  2851,
  2857,
  2861,
  2879,
  2887,
  2897,
  2903,
  2909,
  2917,
  2927,
  2939,
  2953,
  2957,
  2963,
  2969,
  2971,
  2999,
  3001,
  3011,
  3019,
  3023,
  3037,
  3041,
  3049,
  3061,
  3067,
  3079,
  3083,
  3089,
  3109,
  3119,
  3121,
  3137,
  3163,
  3167,
  3169,
  3181,
  3187,
  3191,
  3203,
  3209,
  3217,
  3221,
  3229,
  3251,
  3253,
  3257,
  3259,
  3271,
  3299,
  3301,
  3307,
  3313,
  3319,
  3323,
  3329,
  3331,
  3343,
  3347,
  3359,
  3361,
  3371,
  3373,
  3389,
  3391,
  3407,
  3413,
  3433,
  3449,
  3457,
  3461,
  3463,
  3467,
  3469,
  3491,
  3499,
  3511,
  3517,
  3527,
  3529,
  3533,
  3539,
  3541,
  3547,
  3557,
  3559,
  3571,
  3581,
  3583,
  3593,
  3607,
  3613,
  3617,
  3623,
  3631,
  3637,
  3643,
  3659,
  3671,
  3673,
  3677,
  3691,
  3697,
  3701,
  3709,
  3719,
  3727,
  3733,
  3739,
  3761,
  3767,
  3769,
  3779,
  3793,
  3797,
  3803,
  3821,
  3823,
  3833,
  3847,
  3851,
  3853,
  3863,
  3877,
  3881,
  3889,
  3907,
  3911,
  3917,
  3919,
  3923,
  3929,
  3931,
  3943,
  3947,
  3967,
  3989,
  4001,
  4003,
  4007,
  4013,
  4019,
  4021,
  4027,
  4049,
  4051,
  4057,
  4073,
  4079,
  4091,
  4093,
  4099,
  4111,
  4127,
  4129,
  4133,
  4139,
  4153,
  4157,
  4159,
  4177,
  4201,
  4211,
  4217,
  4219,
  4229,
  4231,
  4241,
  4243,
  4253,
  4259,
  4261,
  4271,
  4273,
  4283,
  4289,
  4297,
  4327,
  4337,
  4339,
  4349,
  4357,
  4363,
  4373,
  4391,
  4397,
  4409,
  4421,
  4423,
  4441,
  4447,
  4451,
  4457,
  4463,
  4481,
  4483,
  4493,
  4507,
  4513,
  4517,
  4519,
  4523,
  4547,
  4549,
  4561,
  4567,
  4583,
  4591,
  4597,
  4603,
  4621,
  4637,
  4639,
  4643,
  4649,
  4651,
  4657,
  4663,
  4673,
  4679,
  4691,
  4703,
  4721,
  4723,
  4729,
  4733,
  4751,
  4759,
  4783,
  4787,
  4789,
  4793,
  4799,
  4801,
  4813,
  4817,
  4831,
  4861,
  4871,
  4877,
  4889,
  4903,
  4909,
  4919,
  4931,
  4933,
  4937,
  4943,
  4951,
  4957,
  4967,
  4969,
  4973,
  4987,
  4993,
  4999
].map((n) => BigInt(n));
function millerRabin(n, k, rand) {
  const len = bitLength(n);
  if (!k) {
    k = Math.max(1, len / 48 | 0);
  }
  const n1 = n - _1n$c;
  let s = 0;
  while (!getBit(n1, s)) {
    s++;
  }
  const d = n >> BigInt(s);
  for (; k > 0; k--) {
    const a = getRandomBigInteger(BigInt(2), n1);
    let x = modExp(a, d, n);
    if (x === _1n$c || x === n1) {
      continue;
    }
    let i;
    for (i = 1; i < s; i++) {
      x = mod$1(x * x, n);
      if (x === _1n$c) {
        return false;
      }
      if (x === n1) {
        break;
      }
    }
    if (i === s) {
      return false;
    }
  }
  return true;
}
var webCrypto$a = util.getWebCrypto();
var nodeCrypto$8 = util.getNodeCrypto();
var nodeCryptoHashes = nodeCrypto$8 && nodeCrypto$8.getHashes();
function nodeHash(type) {
  if (!nodeCrypto$8 || !nodeCryptoHashes.includes(type)) {
    return;
  }
  return async function(data) {
    const shasum = nodeCrypto$8.createHash(type);
    return transform(data, (value) => {
      shasum.update(value);
    }, () => new Uint8Array(shasum.digest()));
  };
}
function nobleHash(nobleHashName, webCryptoHashName) {
  const getNobleHash = async () => {
    const { nobleHashes: nobleHashes2 } = await Promise.resolve().then(function() {
      return noble_hashes;
    });
    const hash2 = nobleHashes2.get(nobleHashName);
    if (!hash2) throw new Error("Unsupported hash");
    return hash2;
  };
  return async function(data) {
    if (isArrayStream(data)) {
      data = await readToEnd(data);
    }
    if (util.isStream(data)) {
      const hash2 = await getNobleHash();
      const hashInstance = hash2.create();
      return transform(data, (value) => {
        hashInstance.update(value);
      }, () => hashInstance.digest());
    } else if (webCrypto$a && webCryptoHashName) {
      return new Uint8Array(await webCrypto$a.digest(webCryptoHashName, data));
    } else {
      const hash2 = await getNobleHash();
      return hash2(data);
    }
  };
}
var md5$1 = nodeHash("md5") || nobleHash("md5");
var sha1$1 = nodeHash("sha1") || nobleHash("sha1", "SHA-1");
var sha224$1 = nodeHash("sha224") || nobleHash("sha224");
var sha256$1 = nodeHash("sha256") || nobleHash("sha256", "SHA-256");
var sha384$1 = nodeHash("sha384") || nobleHash("sha384", "SHA-384");
var sha512$1 = nodeHash("sha512") || nobleHash("sha512", "SHA-512");
var ripemd = nodeHash("ripemd160") || nobleHash("ripemd160");
var sha3_256$1 = nodeHash("sha3-256") || nobleHash("sha3_256");
var sha3_512$1 = nodeHash("sha3-512") || nobleHash("sha3_512");
function computeDigest(algo, data) {
  switch (algo) {
    case enums.hash.md5:
      return md5$1(data);
    case enums.hash.sha1:
      return sha1$1(data);
    case enums.hash.ripemd:
      return ripemd(data);
    case enums.hash.sha256:
      return sha256$1(data);
    case enums.hash.sha384:
      return sha384$1(data);
    case enums.hash.sha512:
      return sha512$1(data);
    case enums.hash.sha224:
      return sha224$1(data);
    case enums.hash.sha3_256:
      return sha3_256$1(data);
    case enums.hash.sha3_512:
      return sha3_512$1(data);
    default:
      throw new Error("Unsupported hash function");
  }
}
function getHashByteLength(algo) {
  switch (algo) {
    case enums.hash.md5:
      return 16;
    case enums.hash.sha1:
    case enums.hash.ripemd:
      return 20;
    case enums.hash.sha256:
      return 32;
    case enums.hash.sha384:
      return 48;
    case enums.hash.sha512:
      return 64;
    case enums.hash.sha224:
      return 28;
    case enums.hash.sha3_256:
      return 32;
    case enums.hash.sha3_512:
      return 64;
    default:
      throw new Error("Invalid hash algorithm.");
  }
}
var hash_headers = [];
hash_headers[1] = [
  48,
  32,
  48,
  12,
  6,
  8,
  42,
  134,
  72,
  134,
  247,
  13,
  2,
  5,
  5,
  0,
  4,
  16
];
hash_headers[2] = [48, 33, 48, 9, 6, 5, 43, 14, 3, 2, 26, 5, 0, 4, 20];
hash_headers[3] = [48, 33, 48, 9, 6, 5, 43, 36, 3, 2, 1, 5, 0, 4, 20];
hash_headers[8] = [
  48,
  49,
  48,
  13,
  6,
  9,
  96,
  134,
  72,
  1,
  101,
  3,
  4,
  2,
  1,
  5,
  0,
  4,
  32
];
hash_headers[9] = [
  48,
  65,
  48,
  13,
  6,
  9,
  96,
  134,
  72,
  1,
  101,
  3,
  4,
  2,
  2,
  5,
  0,
  4,
  48
];
hash_headers[10] = [
  48,
  81,
  48,
  13,
  6,
  9,
  96,
  134,
  72,
  1,
  101,
  3,
  4,
  2,
  3,
  5,
  0,
  4,
  64
];
hash_headers[11] = [
  48,
  45,
  48,
  13,
  6,
  9,
  96,
  134,
  72,
  1,
  101,
  3,
  4,
  2,
  4,
  5,
  0,
  4,
  28
];
function getPKCS1Padding(length) {
  const result = new Uint8Array(length);
  let count = 0;
  while (count < length) {
    const randomBytes3 = getRandomBytes(length - count);
    for (let i = 0; i < randomBytes3.length; i++) {
      if (randomBytes3[i] !== 0) {
        result[count++] = randomBytes3[i];
      }
    }
  }
  return result;
}
function emeEncode(message, keyLength) {
  const mLength = message.length;
  if (mLength > keyLength - 11) {
    throw new Error("Message too long");
  }
  const PS = getPKCS1Padding(keyLength - mLength - 3);
  const encoded = new Uint8Array(keyLength);
  encoded[1] = 2;
  encoded.set(PS, 2);
  encoded.set(message, keyLength - mLength);
  return encoded;
}
function emeDecode(encoded, randomPayload) {
  let offset = 2;
  let separatorNotFound = 1;
  for (let j = offset; j < encoded.length; j++) {
    separatorNotFound &= encoded[j] !== 0;
    offset += separatorNotFound;
  }
  const psLen = offset - 2;
  const payload = encoded.subarray(offset + 1);
  const isValidPadding = encoded[0] === 0 & encoded[1] === 2 & psLen >= 8 & !separatorNotFound;
  if (randomPayload) {
    return util.selectUint8Array(isValidPadding, payload, randomPayload);
  }
  if (isValidPadding) {
    return payload;
  }
  throw new Error("Decryption error");
}
function emsaEncode(algo, hashed, emLen) {
  let i;
  if (hashed.length !== getHashByteLength(algo)) {
    throw new Error("Invalid hash length");
  }
  const hashPrefix = new Uint8Array(hash_headers[algo].length);
  for (i = 0; i < hash_headers[algo].length; i++) {
    hashPrefix[i] = hash_headers[algo][i];
  }
  const tLen = hashPrefix.length + hashed.length;
  if (emLen < tLen + 11) {
    throw new Error("Intended encoded message length too short");
  }
  const PS = new Uint8Array(emLen - tLen - 3).fill(255);
  const EM = new Uint8Array(emLen);
  EM[1] = 1;
  EM.set(PS, 2);
  EM.set(hashPrefix, emLen - tLen);
  EM.set(hashed, emLen - hashed.length);
  return EM;
}
var webCrypto$9 = util.getWebCrypto();
var nodeCrypto$7 = util.getNodeCrypto();
var _1n$b = BigInt(1);
async function sign$6(hashAlgo, data, n, e, d, p, q, u, hashed) {
  if (getHashByteLength(hashAlgo) >= n.length) {
    throw new Error("Digest size cannot exceed key modulus size");
  }
  if (data && !util.isStream(data)) {
    if (util.getWebCrypto()) {
      try {
        return await webSign$1(enums.read(enums.webHash, hashAlgo), data, n, e, d, p, q, u);
      } catch (err2) {
        util.printDebugError(err2);
      }
    } else if (util.getNodeCrypto()) {
      return nodeSign$1(hashAlgo, data, n, e, d, p, q, u);
    }
  }
  return bnSign(hashAlgo, n, d, hashed);
}
async function verify$6(hashAlgo, data, s, n, e, hashed) {
  if (data && !util.isStream(data)) {
    if (util.getWebCrypto()) {
      try {
        return await webVerify$1(enums.read(enums.webHash, hashAlgo), data, s, n, e);
      } catch (err2) {
        util.printDebugError(err2);
      }
    } else if (util.getNodeCrypto()) {
      return nodeVerify$1(hashAlgo, data, s, n, e);
    }
  }
  return bnVerify(hashAlgo, s, n, e, hashed);
}
async function encrypt$6(data, n, e) {
  if (util.getNodeCrypto()) {
    return nodeEncrypt$1(data, n, e);
  }
  return bnEncrypt(data, n, e);
}
async function decrypt$6(data, n, e, d, p, q, u, randomPayload) {
  if (util.getNodeCrypto() && !randomPayload) {
    try {
      return await nodeDecrypt$1(data, n, e, d, p, q, u);
    } catch (err2) {
      util.printDebugError(err2);
    }
  }
  return bnDecrypt(data, n, e, d, p, q, u, randomPayload);
}
async function generate$4(bits2, e) {
  e = BigInt(e);
  if (util.getWebCrypto()) {
    const keyGenOpt = {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: bits2,
      // the specified keysize in bits
      publicExponent: bigIntToUint8Array(e),
      // take three bytes (max 65537) for exponent
      hash: {
        name: "SHA-1"
        // not required for actual RSA keys, but for crypto api 'sign' and 'verify'
      }
    };
    const keyPair = await webCrypto$9.generateKey(keyGenOpt, true, ["sign", "verify"]);
    const jwk = await webCrypto$9.exportKey("jwk", keyPair.privateKey);
    return jwkToPrivate(jwk, e);
  } else if (util.getNodeCrypto()) {
    const opts = {
      modulusLength: bits2,
      publicExponent: bigIntToNumber(e),
      publicKeyEncoding: { type: "pkcs1", format: "jwk" },
      privateKeyEncoding: { type: "pkcs1", format: "jwk" }
    };
    const jwk = await new Promise((resolve2, reject) => {
      nodeCrypto$7.generateKeyPair("rsa", opts, (err2, _, jwkPrivateKey) => {
        if (err2) {
          reject(err2);
        } else {
          resolve2(jwkPrivateKey);
        }
      });
    });
    return jwkToPrivate(jwk, e);
  }
  let p;
  let q;
  let n;
  do {
    q = randomProbablePrime(bits2 - (bits2 >> 1), e, 40);
    p = randomProbablePrime(bits2 >> 1, e, 40);
    n = p * q;
  } while (bitLength(n) !== bits2);
  const phi = (p - _1n$b) * (q - _1n$b);
  if (q < p) {
    [p, q] = [q, p];
  }
  return {
    n: bigIntToUint8Array(n),
    e: bigIntToUint8Array(e),
    d: bigIntToUint8Array(modInv(e, phi)),
    p: bigIntToUint8Array(p),
    q: bigIntToUint8Array(q),
    // dp: d.mod(p.subn(1)),
    // dq: d.mod(q.subn(1)),
    u: bigIntToUint8Array(modInv(p, q))
  };
}
async function validateParams$9(n, e, d, p, q, u) {
  n = uint8ArrayToBigInt(n);
  p = uint8ArrayToBigInt(p);
  q = uint8ArrayToBigInt(q);
  if (p * q !== n) {
    return false;
  }
  const _2n2 = BigInt(2);
  u = uint8ArrayToBigInt(u);
  if (mod$1(p * u, q) !== BigInt(1)) {
    return false;
  }
  e = uint8ArrayToBigInt(e);
  d = uint8ArrayToBigInt(d);
  const nSizeOver3 = BigInt(Math.floor(bitLength(n) / 3));
  const r = getRandomBigInteger(_2n2, _2n2 << nSizeOver3);
  const rde = r * d * e;
  const areInverses = mod$1(rde, p - _1n$b) === r && mod$1(rde, q - _1n$b) === r;
  if (!areInverses) {
    return false;
  }
  return true;
}
async function bnSign(hashAlgo, n, d, hashed) {
  n = uint8ArrayToBigInt(n);
  const m = uint8ArrayToBigInt(emsaEncode(hashAlgo, hashed, byteLength(n)));
  d = uint8ArrayToBigInt(d);
  return bigIntToUint8Array(modExp(m, d, n), "be", byteLength(n));
}
async function webSign$1(hashName, data, n, e, d, p, q, u) {
  const jwk = await privateToJWK$1(n, e, d, p, q, u);
  const algo = {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: hashName }
  };
  const key = await webCrypto$9.importKey("jwk", jwk, algo, false, ["sign"]);
  return new Uint8Array(await webCrypto$9.sign("RSASSA-PKCS1-v1_5", key, data));
}
async function nodeSign$1(hashAlgo, data, n, e, d, p, q, u) {
  const sign = nodeCrypto$7.createSign(enums.read(enums.hash, hashAlgo));
  sign.write(data);
  sign.end();
  const jwk = await privateToJWK$1(n, e, d, p, q, u);
  return new Uint8Array(sign.sign({ key: jwk, format: "jwk", type: "pkcs1" }));
}
async function bnVerify(hashAlgo, s, n, e, hashed) {
  n = uint8ArrayToBigInt(n);
  s = uint8ArrayToBigInt(s);
  e = uint8ArrayToBigInt(e);
  if (s >= n) {
    throw new Error("Signature size cannot exceed modulus size");
  }
  const EM1 = bigIntToUint8Array(modExp(s, e, n), "be", byteLength(n));
  const EM2 = emsaEncode(hashAlgo, hashed, byteLength(n));
  return util.equalsUint8Array(EM1, EM2);
}
async function webVerify$1(hashName, data, s, n, e) {
  const jwk = publicToJWK(n, e);
  const key = await webCrypto$9.importKey("jwk", jwk, {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: hashName }
  }, false, ["verify"]);
  return webCrypto$9.verify("RSASSA-PKCS1-v1_5", key, s, data);
}
async function nodeVerify$1(hashAlgo, data, s, n, e) {
  const jwk = publicToJWK(n, e);
  const key = { key: jwk, format: "jwk", type: "pkcs1" };
  const verify2 = nodeCrypto$7.createVerify(enums.read(enums.hash, hashAlgo));
  verify2.write(data);
  verify2.end();
  try {
    return verify2.verify(key, s);
  } catch (err2) {
    return false;
  }
}
async function nodeEncrypt$1(data, n, e) {
  const jwk = publicToJWK(n, e);
  const key = { key: jwk, format: "jwk", type: "pkcs1", padding: nodeCrypto$7.constants.RSA_PKCS1_PADDING };
  return new Uint8Array(nodeCrypto$7.publicEncrypt(key, data));
}
async function bnEncrypt(data, n, e) {
  n = uint8ArrayToBigInt(n);
  data = uint8ArrayToBigInt(emeEncode(data, byteLength(n)));
  e = uint8ArrayToBigInt(e);
  if (data >= n) {
    throw new Error("Message size cannot exceed modulus size");
  }
  return bigIntToUint8Array(modExp(data, e, n), "be", byteLength(n));
}
async function nodeDecrypt$1(data, n, e, d, p, q, u) {
  const jwk = await privateToJWK$1(n, e, d, p, q, u);
  const key = { key: jwk, format: "jwk", type: "pkcs1", padding: nodeCrypto$7.constants.RSA_PKCS1_PADDING };
  try {
    return new Uint8Array(nodeCrypto$7.privateDecrypt(key, data));
  } catch (err2) {
    throw new Error("Decryption error");
  }
}
async function bnDecrypt(data, n, e, d, p, q, u, randomPayload) {
  data = uint8ArrayToBigInt(data);
  n = uint8ArrayToBigInt(n);
  e = uint8ArrayToBigInt(e);
  d = uint8ArrayToBigInt(d);
  p = uint8ArrayToBigInt(p);
  q = uint8ArrayToBigInt(q);
  u = uint8ArrayToBigInt(u);
  if (data >= n) {
    throw new Error("Data too large.");
  }
  const dq = mod$1(d, q - _1n$b);
  const dp = mod$1(d, p - _1n$b);
  const unblinder = getRandomBigInteger(BigInt(2), n);
  const blinder = modExp(modInv(unblinder, n), e, n);
  data = mod$1(data * blinder, n);
  const mp = modExp(data, dp, p);
  const mq = modExp(data, dq, q);
  const h = mod$1(u * (mq - mp), q);
  let result = h * p + mp;
  result = mod$1(result * unblinder, n);
  return emeDecode(bigIntToUint8Array(result, "be", byteLength(n)), randomPayload);
}
async function privateToJWK$1(n, e, d, p, q, u) {
  const pNum = uint8ArrayToBigInt(p);
  const qNum = uint8ArrayToBigInt(q);
  const dNum = uint8ArrayToBigInt(d);
  let dq = mod$1(dNum, qNum - _1n$b);
  let dp = mod$1(dNum, pNum - _1n$b);
  dp = bigIntToUint8Array(dp);
  dq = bigIntToUint8Array(dq);
  return {
    kty: "RSA",
    n: uint8ArrayToB64(n),
    e: uint8ArrayToB64(e),
    d: uint8ArrayToB64(d),
    // switch p and q
    p: uint8ArrayToB64(q),
    q: uint8ArrayToB64(p),
    // switch dp and dq
    dp: uint8ArrayToB64(dq),
    dq: uint8ArrayToB64(dp),
    qi: uint8ArrayToB64(u),
    ext: true
  };
}
function publicToJWK(n, e) {
  return {
    kty: "RSA",
    n: uint8ArrayToB64(n),
    e: uint8ArrayToB64(e),
    ext: true
  };
}
function jwkToPrivate(jwk, e) {
  return {
    n: b64ToUint8Array(jwk.n),
    e: bigIntToUint8Array(e),
    d: b64ToUint8Array(jwk.d),
    // switch p and q
    p: b64ToUint8Array(jwk.q),
    q: b64ToUint8Array(jwk.p),
    // Since p and q are switched in places, u is the inverse of jwk.q
    u: b64ToUint8Array(jwk.qi)
  };
}
var _1n$a = BigInt(1);
async function encrypt$5(data, p, g, y) {
  p = uint8ArrayToBigInt(p);
  g = uint8ArrayToBigInt(g);
  y = uint8ArrayToBigInt(y);
  const padded = emeEncode(data, byteLength(p));
  const m = uint8ArrayToBigInt(padded);
  const k = getRandomBigInteger(_1n$a, p - _1n$a);
  return {
    c1: bigIntToUint8Array(modExp(g, k, p)),
    c2: bigIntToUint8Array(mod$1(modExp(y, k, p) * m, p))
  };
}
async function decrypt$5(c1, c2, p, x, randomPayload) {
  c1 = uint8ArrayToBigInt(c1);
  c2 = uint8ArrayToBigInt(c2);
  p = uint8ArrayToBigInt(p);
  x = uint8ArrayToBigInt(x);
  const padded = mod$1(modInv(modExp(c1, x, p), p) * c2, p);
  return emeDecode(bigIntToUint8Array(padded, "be", byteLength(p)), randomPayload);
}
async function validateParams$8(p, g, y, x) {
  p = uint8ArrayToBigInt(p);
  g = uint8ArrayToBigInt(g);
  y = uint8ArrayToBigInt(y);
  if (g <= _1n$a || g >= p) {
    return false;
  }
  const pSize = BigInt(bitLength(p));
  const _1023n = BigInt(1023);
  if (pSize < _1023n) {
    return false;
  }
  if (modExp(g, p - _1n$a, p) !== _1n$a) {
    return false;
  }
  let res = g;
  let i = BigInt(1);
  const _2n2 = BigInt(2);
  const threshold = _2n2 << BigInt(17);
  while (i < threshold) {
    res = mod$1(res * g, p);
    if (res === _1n$a) {
      return false;
    }
    i++;
  }
  x = uint8ArrayToBigInt(x);
  const r = getRandomBigInteger(_2n2 << pSize - _1n$a, _2n2 << pSize);
  const rqx = (p - _1n$a) * r + x;
  if (y !== modExp(g, rqx, p)) {
    return false;
  }
  return true;
}
var crypto$2 = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : void 0;
var nacl = {};
var gf = function(init) {
  var i, r = new Float64Array(16);
  if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
  return r;
};
var randombytes = function() {
  throw new Error("no PRNG");
};
var _9 = new Uint8Array(32);
_9[0] = 9;
var gf0 = gf();
var gf1 = gf([1]);
var _121665 = gf([56129, 1]);
var D = gf([30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139, 11119, 27886, 20995]);
var D2 = gf([61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743, 22239, 55772, 9222]);
var X = gf([54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316, 21502, 52590, 14035, 8553]);
var Y = gf([26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214]);
var I = gf([41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099, 20417, 9344, 11139]);
function ts64(x, i, h, l) {
  x[i] = h >> 24 & 255;
  x[i + 1] = h >> 16 & 255;
  x[i + 2] = h >> 8 & 255;
  x[i + 3] = h & 255;
  x[i + 4] = l >> 24 & 255;
  x[i + 5] = l >> 16 & 255;
  x[i + 6] = l >> 8 & 255;
  x[i + 7] = l & 255;
}
function vn(x, xi, y, yi, n) {
  var i, d = 0;
  for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
  return (1 & d - 1 >>> 8) - 1;
}
function crypto_verify_32(x, xi, y, yi) {
  return vn(x, xi, y, yi, 32);
}
function set25519(r, a) {
  var i;
  for (i = 0; i < 16; i++) r[i] = a[i] | 0;
}
function car25519(o) {
  var i, v, c = 1;
  for (i = 0; i < 16; i++) {
    v = o[i] + c + 65535;
    c = Math.floor(v / 65536);
    o[i] = v - c * 65536;
  }
  o[0] += c - 1 + 37 * (c - 1);
}
function sel25519(p, q, b) {
  var t, c = ~(b - 1);
  for (var i = 0; i < 16; i++) {
    t = c & (p[i] ^ q[i]);
    p[i] ^= t;
    q[i] ^= t;
  }
}
function pack25519(o, n) {
  var i, j, b;
  var m = gf(), t = gf();
  for (i = 0; i < 16; i++) t[i] = n[i];
  car25519(t);
  car25519(t);
  car25519(t);
  for (j = 0; j < 2; j++) {
    m[0] = t[0] - 65517;
    for (i = 1; i < 15; i++) {
      m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
      m[i - 1] &= 65535;
    }
    m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
    b = m[15] >> 16 & 1;
    m[14] &= 65535;
    sel25519(t, m, 1 - b);
  }
  for (i = 0; i < 16; i++) {
    o[2 * i] = t[i] & 255;
    o[2 * i + 1] = t[i] >> 8;
  }
}
function neq25519(a, b) {
  var c = new Uint8Array(32), d = new Uint8Array(32);
  pack25519(c, a);
  pack25519(d, b);
  return crypto_verify_32(c, 0, d, 0);
}
function par25519(a) {
  var d = new Uint8Array(32);
  pack25519(d, a);
  return d[0] & 1;
}
function unpack25519(o, n) {
  var i;
  for (i = 0; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
  o[15] &= 32767;
}
function A(o, a, b) {
  for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
}
function Z(o, a, b) {
  for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
}
function M(o, a, b) {
  var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
  v = a[0];
  t0 += v * b0;
  t1 += v * b1;
  t2 += v * b2;
  t3 += v * b3;
  t4 += v * b4;
  t5 += v * b5;
  t6 += v * b6;
  t7 += v * b7;
  t8 += v * b8;
  t9 += v * b9;
  t10 += v * b10;
  t11 += v * b11;
  t12 += v * b12;
  t13 += v * b13;
  t14 += v * b14;
  t15 += v * b15;
  v = a[1];
  t1 += v * b0;
  t2 += v * b1;
  t3 += v * b2;
  t4 += v * b3;
  t5 += v * b4;
  t6 += v * b5;
  t7 += v * b6;
  t8 += v * b7;
  t9 += v * b8;
  t10 += v * b9;
  t11 += v * b10;
  t12 += v * b11;
  t13 += v * b12;
  t14 += v * b13;
  t15 += v * b14;
  t16 += v * b15;
  v = a[2];
  t2 += v * b0;
  t3 += v * b1;
  t4 += v * b2;
  t5 += v * b3;
  t6 += v * b4;
  t7 += v * b5;
  t8 += v * b6;
  t9 += v * b7;
  t10 += v * b8;
  t11 += v * b9;
  t12 += v * b10;
  t13 += v * b11;
  t14 += v * b12;
  t15 += v * b13;
  t16 += v * b14;
  t17 += v * b15;
  v = a[3];
  t3 += v * b0;
  t4 += v * b1;
  t5 += v * b2;
  t6 += v * b3;
  t7 += v * b4;
  t8 += v * b5;
  t9 += v * b6;
  t10 += v * b7;
  t11 += v * b8;
  t12 += v * b9;
  t13 += v * b10;
  t14 += v * b11;
  t15 += v * b12;
  t16 += v * b13;
  t17 += v * b14;
  t18 += v * b15;
  v = a[4];
  t4 += v * b0;
  t5 += v * b1;
  t6 += v * b2;
  t7 += v * b3;
  t8 += v * b4;
  t9 += v * b5;
  t10 += v * b6;
  t11 += v * b7;
  t12 += v * b8;
  t13 += v * b9;
  t14 += v * b10;
  t15 += v * b11;
  t16 += v * b12;
  t17 += v * b13;
  t18 += v * b14;
  t19 += v * b15;
  v = a[5];
  t5 += v * b0;
  t6 += v * b1;
  t7 += v * b2;
  t8 += v * b3;
  t9 += v * b4;
  t10 += v * b5;
  t11 += v * b6;
  t12 += v * b7;
  t13 += v * b8;
  t14 += v * b9;
  t15 += v * b10;
  t16 += v * b11;
  t17 += v * b12;
  t18 += v * b13;
  t19 += v * b14;
  t20 += v * b15;
  v = a[6];
  t6 += v * b0;
  t7 += v * b1;
  t8 += v * b2;
  t9 += v * b3;
  t10 += v * b4;
  t11 += v * b5;
  t12 += v * b6;
  t13 += v * b7;
  t14 += v * b8;
  t15 += v * b9;
  t16 += v * b10;
  t17 += v * b11;
  t18 += v * b12;
  t19 += v * b13;
  t20 += v * b14;
  t21 += v * b15;
  v = a[7];
  t7 += v * b0;
  t8 += v * b1;
  t9 += v * b2;
  t10 += v * b3;
  t11 += v * b4;
  t12 += v * b5;
  t13 += v * b6;
  t14 += v * b7;
  t15 += v * b8;
  t16 += v * b9;
  t17 += v * b10;
  t18 += v * b11;
  t19 += v * b12;
  t20 += v * b13;
  t21 += v * b14;
  t22 += v * b15;
  v = a[8];
  t8 += v * b0;
  t9 += v * b1;
  t10 += v * b2;
  t11 += v * b3;
  t12 += v * b4;
  t13 += v * b5;
  t14 += v * b6;
  t15 += v * b7;
  t16 += v * b8;
  t17 += v * b9;
  t18 += v * b10;
  t19 += v * b11;
  t20 += v * b12;
  t21 += v * b13;
  t22 += v * b14;
  t23 += v * b15;
  v = a[9];
  t9 += v * b0;
  t10 += v * b1;
  t11 += v * b2;
  t12 += v * b3;
  t13 += v * b4;
  t14 += v * b5;
  t15 += v * b6;
  t16 += v * b7;
  t17 += v * b8;
  t18 += v * b9;
  t19 += v * b10;
  t20 += v * b11;
  t21 += v * b12;
  t22 += v * b13;
  t23 += v * b14;
  t24 += v * b15;
  v = a[10];
  t10 += v * b0;
  t11 += v * b1;
  t12 += v * b2;
  t13 += v * b3;
  t14 += v * b4;
  t15 += v * b5;
  t16 += v * b6;
  t17 += v * b7;
  t18 += v * b8;
  t19 += v * b9;
  t20 += v * b10;
  t21 += v * b11;
  t22 += v * b12;
  t23 += v * b13;
  t24 += v * b14;
  t25 += v * b15;
  v = a[11];
  t11 += v * b0;
  t12 += v * b1;
  t13 += v * b2;
  t14 += v * b3;
  t15 += v * b4;
  t16 += v * b5;
  t17 += v * b6;
  t18 += v * b7;
  t19 += v * b8;
  t20 += v * b9;
  t21 += v * b10;
  t22 += v * b11;
  t23 += v * b12;
  t24 += v * b13;
  t25 += v * b14;
  t26 += v * b15;
  v = a[12];
  t12 += v * b0;
  t13 += v * b1;
  t14 += v * b2;
  t15 += v * b3;
  t16 += v * b4;
  t17 += v * b5;
  t18 += v * b6;
  t19 += v * b7;
  t20 += v * b8;
  t21 += v * b9;
  t22 += v * b10;
  t23 += v * b11;
  t24 += v * b12;
  t25 += v * b13;
  t26 += v * b14;
  t27 += v * b15;
  v = a[13];
  t13 += v * b0;
  t14 += v * b1;
  t15 += v * b2;
  t16 += v * b3;
  t17 += v * b4;
  t18 += v * b5;
  t19 += v * b6;
  t20 += v * b7;
  t21 += v * b8;
  t22 += v * b9;
  t23 += v * b10;
  t24 += v * b11;
  t25 += v * b12;
  t26 += v * b13;
  t27 += v * b14;
  t28 += v * b15;
  v = a[14];
  t14 += v * b0;
  t15 += v * b1;
  t16 += v * b2;
  t17 += v * b3;
  t18 += v * b4;
  t19 += v * b5;
  t20 += v * b6;
  t21 += v * b7;
  t22 += v * b8;
  t23 += v * b9;
  t24 += v * b10;
  t25 += v * b11;
  t26 += v * b12;
  t27 += v * b13;
  t28 += v * b14;
  t29 += v * b15;
  v = a[15];
  t15 += v * b0;
  t16 += v * b1;
  t17 += v * b2;
  t18 += v * b3;
  t19 += v * b4;
  t20 += v * b5;
  t21 += v * b6;
  t22 += v * b7;
  t23 += v * b8;
  t24 += v * b9;
  t25 += v * b10;
  t26 += v * b11;
  t27 += v * b12;
  t28 += v * b13;
  t29 += v * b14;
  t30 += v * b15;
  t0 += 38 * t16;
  t1 += 38 * t17;
  t2 += 38 * t18;
  t3 += 38 * t19;
  t4 += 38 * t20;
  t5 += 38 * t21;
  t6 += 38 * t22;
  t7 += 38 * t23;
  t8 += 38 * t24;
  t9 += 38 * t25;
  t10 += 38 * t26;
  t11 += 38 * t27;
  t12 += 38 * t28;
  t13 += 38 * t29;
  t14 += 38 * t30;
  c = 1;
  v = t0 + c + 65535;
  c = Math.floor(v / 65536);
  t0 = v - c * 65536;
  v = t1 + c + 65535;
  c = Math.floor(v / 65536);
  t1 = v - c * 65536;
  v = t2 + c + 65535;
  c = Math.floor(v / 65536);
  t2 = v - c * 65536;
  v = t3 + c + 65535;
  c = Math.floor(v / 65536);
  t3 = v - c * 65536;
  v = t4 + c + 65535;
  c = Math.floor(v / 65536);
  t4 = v - c * 65536;
  v = t5 + c + 65535;
  c = Math.floor(v / 65536);
  t5 = v - c * 65536;
  v = t6 + c + 65535;
  c = Math.floor(v / 65536);
  t6 = v - c * 65536;
  v = t7 + c + 65535;
  c = Math.floor(v / 65536);
  t7 = v - c * 65536;
  v = t8 + c + 65535;
  c = Math.floor(v / 65536);
  t8 = v - c * 65536;
  v = t9 + c + 65535;
  c = Math.floor(v / 65536);
  t9 = v - c * 65536;
  v = t10 + c + 65535;
  c = Math.floor(v / 65536);
  t10 = v - c * 65536;
  v = t11 + c + 65535;
  c = Math.floor(v / 65536);
  t11 = v - c * 65536;
  v = t12 + c + 65535;
  c = Math.floor(v / 65536);
  t12 = v - c * 65536;
  v = t13 + c + 65535;
  c = Math.floor(v / 65536);
  t13 = v - c * 65536;
  v = t14 + c + 65535;
  c = Math.floor(v / 65536);
  t14 = v - c * 65536;
  v = t15 + c + 65535;
  c = Math.floor(v / 65536);
  t15 = v - c * 65536;
  t0 += c - 1 + 37 * (c - 1);
  c = 1;
  v = t0 + c + 65535;
  c = Math.floor(v / 65536);
  t0 = v - c * 65536;
  v = t1 + c + 65535;
  c = Math.floor(v / 65536);
  t1 = v - c * 65536;
  v = t2 + c + 65535;
  c = Math.floor(v / 65536);
  t2 = v - c * 65536;
  v = t3 + c + 65535;
  c = Math.floor(v / 65536);
  t3 = v - c * 65536;
  v = t4 + c + 65535;
  c = Math.floor(v / 65536);
  t4 = v - c * 65536;
  v = t5 + c + 65535;
  c = Math.floor(v / 65536);
  t5 = v - c * 65536;
  v = t6 + c + 65535;
  c = Math.floor(v / 65536);
  t6 = v - c * 65536;
  v = t7 + c + 65535;
  c = Math.floor(v / 65536);
  t7 = v - c * 65536;
  v = t8 + c + 65535;
  c = Math.floor(v / 65536);
  t8 = v - c * 65536;
  v = t9 + c + 65535;
  c = Math.floor(v / 65536);
  t9 = v - c * 65536;
  v = t10 + c + 65535;
  c = Math.floor(v / 65536);
  t10 = v - c * 65536;
  v = t11 + c + 65535;
  c = Math.floor(v / 65536);
  t11 = v - c * 65536;
  v = t12 + c + 65535;
  c = Math.floor(v / 65536);
  t12 = v - c * 65536;
  v = t13 + c + 65535;
  c = Math.floor(v / 65536);
  t13 = v - c * 65536;
  v = t14 + c + 65535;
  c = Math.floor(v / 65536);
  t14 = v - c * 65536;
  v = t15 + c + 65535;
  c = Math.floor(v / 65536);
  t15 = v - c * 65536;
  t0 += c - 1 + 37 * (c - 1);
  o[0] = t0;
  o[1] = t1;
  o[2] = t2;
  o[3] = t3;
  o[4] = t4;
  o[5] = t5;
  o[6] = t6;
  o[7] = t7;
  o[8] = t8;
  o[9] = t9;
  o[10] = t10;
  o[11] = t11;
  o[12] = t12;
  o[13] = t13;
  o[14] = t14;
  o[15] = t15;
}
function S(o, a) {
  M(o, a, a);
}
function inv25519(o, i) {
  var c = gf();
  var a;
  for (a = 0; a < 16; a++) c[a] = i[a];
  for (a = 253; a >= 0; a--) {
    S(c, c);
    if (a !== 2 && a !== 4) M(c, c, i);
  }
  for (a = 0; a < 16; a++) o[a] = c[a];
}
function pow2523(o, i) {
  var c = gf();
  var a;
  for (a = 0; a < 16; a++) c[a] = i[a];
  for (a = 250; a >= 0; a--) {
    S(c, c);
    if (a !== 1) M(c, c, i);
  }
  for (a = 0; a < 16; a++) o[a] = c[a];
}
function crypto_scalarmult(q, n, p) {
  var z = new Uint8Array(32);
  var x = new Float64Array(80), r, i;
  var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f2 = gf();
  for (i = 0; i < 31; i++) z[i] = n[i];
  z[31] = n[31] & 127 | 64;
  z[0] &= 248;
  unpack25519(x, p);
  for (i = 0; i < 16; i++) {
    b[i] = x[i];
    d[i] = a[i] = c[i] = 0;
  }
  a[0] = d[0] = 1;
  for (i = 254; i >= 0; --i) {
    r = z[i >>> 3] >>> (i & 7) & 1;
    sel25519(a, b, r);
    sel25519(c, d, r);
    A(e, a, c);
    Z(a, a, c);
    A(c, b, d);
    Z(b, b, d);
    S(d, e);
    S(f2, a);
    M(a, c, a);
    M(c, b, e);
    A(e, a, c);
    Z(a, a, c);
    S(b, a);
    Z(c, d, f2);
    M(a, c, _121665);
    A(a, a, d);
    M(c, c, a);
    M(a, d, f2);
    M(d, b, x);
    S(b, e);
    sel25519(a, b, r);
    sel25519(c, d, r);
  }
  for (i = 0; i < 16; i++) {
    x[i + 16] = a[i];
    x[i + 32] = c[i];
    x[i + 48] = b[i];
    x[i + 64] = d[i];
  }
  var x32 = x.subarray(32);
  var x16 = x.subarray(16);
  inv25519(x32, x32);
  M(x16, x16, x32);
  pack25519(q, x16);
  return 0;
}
function crypto_scalarmult_base(q, n) {
  return crypto_scalarmult(q, n, _9);
}
function crypto_box_keypair(y, x) {
  randombytes(x, 32);
  return crypto_scalarmult_base(y, x);
}
var K$1 = [
  1116352408,
  3609767458,
  1899447441,
  602891725,
  3049323471,
  3964484399,
  3921009573,
  2173295548,
  961987163,
  4081628472,
  1508970993,
  3053834265,
  2453635748,
  2937671579,
  2870763221,
  3664609560,
  3624381080,
  2734883394,
  310598401,
  1164996542,
  607225278,
  1323610764,
  1426881987,
  3590304994,
  1925078388,
  4068182383,
  2162078206,
  991336113,
  2614888103,
  633803317,
  3248222580,
  3479774868,
  3835390401,
  2666613458,
  4022224774,
  944711139,
  264347078,
  2341262773,
  604807628,
  2007800933,
  770255983,
  1495990901,
  1249150122,
  1856431235,
  1555081692,
  3175218132,
  1996064986,
  2198950837,
  2554220882,
  3999719339,
  2821834349,
  766784016,
  2952996808,
  2566594879,
  3210313671,
  3203337956,
  3336571891,
  1034457026,
  3584528711,
  2466948901,
  113926993,
  3758326383,
  338241895,
  168717936,
  666307205,
  1188179964,
  773529912,
  1546045734,
  1294757372,
  1522805485,
  1396182291,
  2643833823,
  1695183700,
  2343527390,
  1986661051,
  1014477480,
  2177026350,
  1206759142,
  2456956037,
  344077627,
  2730485921,
  1290863460,
  2820302411,
  3158454273,
  3259730800,
  3505952657,
  3345764771,
  106217008,
  3516065817,
  3606008344,
  3600352804,
  1432725776,
  4094571909,
  1467031594,
  275423344,
  851169720,
  430227734,
  3100823752,
  506948616,
  1363258195,
  659060556,
  3750685593,
  883997877,
  3785050280,
  958139571,
  3318307427,
  1322822218,
  3812723403,
  1537002063,
  2003034995,
  1747873779,
  3602036899,
  1955562222,
  1575990012,
  2024104815,
  1125592928,
  2227730452,
  2716904306,
  2361852424,
  442776044,
  2428436474,
  593698344,
  2756734187,
  3733110249,
  3204031479,
  2999351573,
  3329325298,
  3815920427,
  3391569614,
  3928383900,
  3515267271,
  566280711,
  3940187606,
  3454069534,
  4118630271,
  4000239992,
  116418474,
  1914138554,
  174292421,
  2731055270,
  289380356,
  3203993006,
  460393269,
  320620315,
  685471733,
  587496836,
  852142971,
  1086792851,
  1017036298,
  365543100,
  1126000580,
  2618297676,
  1288033470,
  3409855158,
  1501505948,
  4234509866,
  1607167915,
  987167468,
  1816402316,
  1246189591
];
function crypto_hashblocks_hl(hh, hl, m, n) {
  var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
  var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
  var pos2 = 0;
  while (n >= 128) {
    for (i = 0; i < 16; i++) {
      j = 8 * i + pos2;
      wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
      wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
    }
    for (i = 0; i < 80; i++) {
      bh0 = ah0;
      bh1 = ah1;
      bh2 = ah2;
      bh3 = ah3;
      bh4 = ah4;
      bh5 = ah5;
      bh6 = ah6;
      bh7 = ah7;
      bl0 = al0;
      bl1 = al1;
      bl2 = al2;
      bl3 = al3;
      bl4 = al4;
      bl5 = al5;
      bl6 = al6;
      bl7 = al7;
      h = ah7;
      l = al7;
      a = l & 65535;
      b = l >>> 16;
      c = h & 65535;
      d = h >>> 16;
      h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
      l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      h = ah4 & ah5 ^ ~ah4 & ah6;
      l = al4 & al5 ^ ~al4 & al6;
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      h = K$1[i * 2];
      l = K$1[i * 2 + 1];
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      h = wh[i % 16];
      l = wl[i % 16];
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      th = c & 65535 | d << 16;
      tl = a & 65535 | b << 16;
      h = th;
      l = tl;
      a = l & 65535;
      b = l >>> 16;
      c = h & 65535;
      d = h >>> 16;
      h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
      l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
      l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      bh7 = c & 65535 | d << 16;
      bl7 = a & 65535 | b << 16;
      h = bh3;
      l = bl3;
      a = l & 65535;
      b = l >>> 16;
      c = h & 65535;
      d = h >>> 16;
      h = th;
      l = tl;
      a += l & 65535;
      b += l >>> 16;
      c += h & 65535;
      d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      bh3 = c & 65535 | d << 16;
      bl3 = a & 65535 | b << 16;
      ah1 = bh0;
      ah2 = bh1;
      ah3 = bh2;
      ah4 = bh3;
      ah5 = bh4;
      ah6 = bh5;
      ah7 = bh6;
      ah0 = bh7;
      al1 = bl0;
      al2 = bl1;
      al3 = bl2;
      al4 = bl3;
      al5 = bl4;
      al6 = bl5;
      al7 = bl6;
      al0 = bl7;
      if (i % 16 === 15) {
        for (j = 0; j < 16; j++) {
          h = wh[j];
          l = wl[j];
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = wh[(j + 9) % 16];
          l = wl[(j + 9) % 16];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          th = wh[(j + 1) % 16];
          tl = wl[(j + 1) % 16];
          h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
          l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          th = wh[(j + 14) % 16];
          tl = wl[(j + 14) % 16];
          h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
          l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          wh[j] = c & 65535 | d << 16;
          wl[j] = a & 65535 | b << 16;
        }
      }
    }
    h = ah0;
    l = al0;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[0];
    l = hl[0];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[0] = ah0 = c & 65535 | d << 16;
    hl[0] = al0 = a & 65535 | b << 16;
    h = ah1;
    l = al1;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[1];
    l = hl[1];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[1] = ah1 = c & 65535 | d << 16;
    hl[1] = al1 = a & 65535 | b << 16;
    h = ah2;
    l = al2;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[2];
    l = hl[2];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[2] = ah2 = c & 65535 | d << 16;
    hl[2] = al2 = a & 65535 | b << 16;
    h = ah3;
    l = al3;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[3];
    l = hl[3];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[3] = ah3 = c & 65535 | d << 16;
    hl[3] = al3 = a & 65535 | b << 16;
    h = ah4;
    l = al4;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[4];
    l = hl[4];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[4] = ah4 = c & 65535 | d << 16;
    hl[4] = al4 = a & 65535 | b << 16;
    h = ah5;
    l = al5;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[5];
    l = hl[5];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[5] = ah5 = c & 65535 | d << 16;
    hl[5] = al5 = a & 65535 | b << 16;
    h = ah6;
    l = al6;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[6];
    l = hl[6];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[6] = ah6 = c & 65535 | d << 16;
    hl[6] = al6 = a & 65535 | b << 16;
    h = ah7;
    l = al7;
    a = l & 65535;
    b = l >>> 16;
    c = h & 65535;
    d = h >>> 16;
    h = hh[7];
    l = hl[7];
    a += l & 65535;
    b += l >>> 16;
    c += h & 65535;
    d += h >>> 16;
    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;
    hh[7] = ah7 = c & 65535 | d << 16;
    hl[7] = al7 = a & 65535 | b << 16;
    pos2 += 128;
    n -= 128;
  }
  return n;
}
function crypto_hash(out, m, n) {
  var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
  hh[0] = 1779033703;
  hh[1] = 3144134277;
  hh[2] = 1013904242;
  hh[3] = 2773480762;
  hh[4] = 1359893119;
  hh[5] = 2600822924;
  hh[6] = 528734635;
  hh[7] = 1541459225;
  hl[0] = 4089235720;
  hl[1] = 2227873595;
  hl[2] = 4271175723;
  hl[3] = 1595750129;
  hl[4] = 2917565137;
  hl[5] = 725511199;
  hl[6] = 4215389547;
  hl[7] = 327033209;
  crypto_hashblocks_hl(hh, hl, m, n);
  n %= 128;
  for (i = 0; i < n; i++) x[i] = m[b - n + i];
  x[n] = 128;
  n = 256 - 128 * (n < 112 ? 1 : 0);
  x[n - 9] = 0;
  ts64(x, n - 8, b / 536870912 | 0, b << 3);
  crypto_hashblocks_hl(hh, hl, x, n);
  for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
  return 0;
}
function add$1(p, q) {
  var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f2 = gf(), g = gf(), h = gf(), t = gf();
  Z(a, p[1], p[0]);
  Z(t, q[1], q[0]);
  M(a, a, t);
  A(b, p[0], p[1]);
  A(t, q[0], q[1]);
  M(b, b, t);
  M(c, p[3], q[3]);
  M(c, c, D2);
  M(d, p[2], q[2]);
  A(d, d, d);
  Z(e, b, a);
  Z(f2, d, c);
  A(g, d, c);
  A(h, b, a);
  M(p[0], e, f2);
  M(p[1], h, g);
  M(p[2], g, f2);
  M(p[3], e, h);
}
function cswap(p, q, b) {
  var i;
  for (i = 0; i < 4; i++) {
    sel25519(p[i], q[i], b);
  }
}
function pack(r, p) {
  var tx = gf(), ty = gf(), zi = gf();
  inv25519(zi, p[2]);
  M(tx, p[0], zi);
  M(ty, p[1], zi);
  pack25519(r, ty);
  r[31] ^= par25519(tx) << 7;
}
function scalarmult(p, q, s) {
  var b, i;
  set25519(p[0], gf0);
  set25519(p[1], gf1);
  set25519(p[2], gf1);
  set25519(p[3], gf0);
  for (i = 255; i >= 0; --i) {
    b = s[i / 8 | 0] >> (i & 7) & 1;
    cswap(p, q, b);
    add$1(q, p);
    add$1(p, p);
    cswap(p, q, b);
  }
}
function scalarbase(p, s) {
  var q = [gf(), gf(), gf(), gf()];
  set25519(q[0], X);
  set25519(q[1], Y);
  set25519(q[2], gf1);
  M(q[3], X, Y);
  scalarmult(p, q, s);
}
function crypto_sign_keypair(pk, sk, seeded) {
  var d = new Uint8Array(64);
  var p = [gf(), gf(), gf(), gf()];
  var i;
  if (!seeded) randombytes(sk, 32);
  crypto_hash(d, sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;
  scalarbase(p, d);
  pack(pk, p);
  for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
  return 0;
}
var L = new Float64Array([237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16]);
function modL(r, x) {
  var carry, i, j, k;
  for (i = 63; i >= 32; --i) {
    carry = 0;
    for (j = i - 32, k = i - 12; j < k; ++j) {
      x[j] += carry - 16 * x[i] * L[j - (i - 32)];
      carry = Math.floor((x[j] + 128) / 256);
      x[j] -= carry * 256;
    }
    x[j] += carry;
    x[i] = 0;
  }
  carry = 0;
  for (j = 0; j < 32; j++) {
    x[j] += carry - (x[31] >> 4) * L[j];
    carry = x[j] >> 8;
    x[j] &= 255;
  }
  for (j = 0; j < 32; j++) x[j] -= carry * L[j];
  for (i = 0; i < 32; i++) {
    x[i + 1] += x[i] >> 8;
    r[i] = x[i] & 255;
  }
}
function reduce(r) {
  var x = new Float64Array(64), i;
  for (i = 0; i < 64; i++) x[i] = r[i];
  for (i = 0; i < 64; i++) r[i] = 0;
  modL(r, x);
}
function crypto_sign(sm, m, n, sk) {
  var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
  var i, j, x = new Float64Array(64);
  var p = [gf(), gf(), gf(), gf()];
  crypto_hash(d, sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;
  var smlen = n + 64;
  for (i = 0; i < n; i++) sm[64 + i] = m[i];
  for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
  crypto_hash(r, sm.subarray(32), n + 32);
  reduce(r);
  scalarbase(p, r);
  pack(sm, p);
  for (i = 32; i < 64; i++) sm[i] = sk[i];
  crypto_hash(h, sm, n + 64);
  reduce(h);
  for (i = 0; i < 64; i++) x[i] = 0;
  for (i = 0; i < 32; i++) x[i] = r[i];
  for (i = 0; i < 32; i++) {
    for (j = 0; j < 32; j++) {
      x[i + j] += h[i] * d[j];
    }
  }
  modL(sm.subarray(32), x);
  return smlen;
}
function unpackneg(r, p) {
  var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
  set25519(r[2], gf1);
  unpack25519(r[1], p);
  S(num, r[1]);
  M(den, num, D);
  Z(num, num, r[2]);
  A(den, r[2], den);
  S(den2, den);
  S(den4, den2);
  M(den6, den4, den2);
  M(t, den6, num);
  M(t, t, den);
  pow2523(t, t);
  M(t, t, num);
  M(t, t, den);
  M(t, t, den);
  M(r[0], t, den);
  S(chk, r[0]);
  M(chk, chk, den);
  if (neq25519(chk, num)) M(r[0], r[0], I);
  S(chk, r[0]);
  M(chk, chk, den);
  if (neq25519(chk, num)) return -1;
  if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
  M(r[3], r[0], r[1]);
  return 0;
}
function crypto_sign_open(m, sm, n, pk) {
  var i;
  var t = new Uint8Array(32), h = new Uint8Array(64);
  var p = [gf(), gf(), gf(), gf()], q = [gf(), gf(), gf(), gf()];
  if (n < 64) return -1;
  if (unpackneg(q, pk)) return -1;
  for (i = 0; i < n; i++) m[i] = sm[i];
  for (i = 0; i < 32; i++) m[i + 32] = pk[i];
  crypto_hash(h, m, n);
  reduce(h);
  scalarmult(p, q, h);
  scalarbase(q, sm.subarray(32));
  add$1(p, q);
  pack(t, p);
  n -= 64;
  if (crypto_verify_32(sm, 0, t, 0)) {
    for (i = 0; i < n; i++) m[i] = 0;
    return -1;
  }
  for (i = 0; i < n; i++) m[i] = sm[i + 64];
  return n;
}
var crypto_scalarmult_BYTES = 32;
var crypto_scalarmult_SCALARBYTES = 32;
var crypto_box_PUBLICKEYBYTES = 32;
var crypto_box_SECRETKEYBYTES = 32;
var crypto_sign_BYTES = 64;
var crypto_sign_PUBLICKEYBYTES = 32;
var crypto_sign_SECRETKEYBYTES = 64;
var crypto_sign_SEEDBYTES = 32;
function checkArrayTypes() {
  for (var i = 0; i < arguments.length; i++) {
    if (!(arguments[i] instanceof Uint8Array))
      throw new TypeError("unexpected type, use Uint8Array");
  }
}
function cleanup(arr) {
  for (var i = 0; i < arr.length; i++) arr[i] = 0;
}
nacl.scalarMult = function(n, p) {
  checkArrayTypes(n, p);
  if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
  if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
  var q = new Uint8Array(crypto_scalarmult_BYTES);
  crypto_scalarmult(q, n, p);
  return q;
};
nacl.box = {};
nacl.box.keyPair = function() {
  var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
  var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
  crypto_box_keypair(pk, sk);
  return { publicKey: pk, secretKey: sk };
};
nacl.box.keyPair.fromSecretKey = function(secretKey) {
  checkArrayTypes(secretKey);
  if (secretKey.length !== crypto_box_SECRETKEYBYTES)
    throw new Error("bad secret key size");
  var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
  crypto_scalarmult_base(pk, secretKey);
  return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
};
nacl.sign = function(msg, secretKey) {
  checkArrayTypes(msg, secretKey);
  if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
    throw new Error("bad secret key size");
  var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
  crypto_sign(signedMsg, msg, msg.length, secretKey);
  return signedMsg;
};
nacl.sign.detached = function(msg, secretKey) {
  var signedMsg = nacl.sign(msg, secretKey);
  var sig = new Uint8Array(crypto_sign_BYTES);
  for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
  return sig;
};
nacl.sign.detached.verify = function(msg, sig, publicKey) {
  checkArrayTypes(msg, sig, publicKey);
  if (sig.length !== crypto_sign_BYTES)
    throw new Error("bad signature size");
  if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
    throw new Error("bad public key size");
  var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
  var m = new Uint8Array(crypto_sign_BYTES + msg.length);
  var i;
  for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
  for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
  return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
};
nacl.sign.keyPair = function() {
  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
  var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
  crypto_sign_keypair(pk, sk);
  return { publicKey: pk, secretKey: sk };
};
nacl.sign.keyPair.fromSecretKey = function(secretKey) {
  checkArrayTypes(secretKey);
  if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
    throw new Error("bad secret key size");
  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
  for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
  return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
};
nacl.sign.keyPair.fromSeed = function(seed) {
  checkArrayTypes(seed);
  if (seed.length !== crypto_sign_SEEDBYTES)
    throw new Error("bad seed size");
  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
  var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
  for (var i = 0; i < 32; i++) sk[i] = seed[i];
  crypto_sign_keypair(pk, sk, true);
  return { publicKey: pk, secretKey: sk };
};
nacl.setPRNG = function(fn) {
  randombytes = fn;
};
(function() {
  if (crypto$2 && crypto$2.getRandomValues) {
    var QUOTA = 65536;
    nacl.setPRNG(function(x, n) {
      var i, v = new Uint8Array(n);
      for (i = 0; i < n; i += QUOTA) {
        crypto$2.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
      }
      for (i = 0; i < n; i++) x[i] = v[i];
      cleanup(v);
    });
  }
})();
var knownOIDs = {
  "2a8648ce3d030107": enums.curve.nistP256,
  "2b81040022": enums.curve.nistP384,
  "2b81040023": enums.curve.nistP521,
  "2b8104000a": enums.curve.secp256k1,
  "2b06010401da470f01": enums.curve.ed25519Legacy,
  "2b060104019755010501": enums.curve.curve25519Legacy,
  "2b2403030208010107": enums.curve.brainpoolP256r1,
  "2b240303020801010b": enums.curve.brainpoolP384r1,
  "2b240303020801010d": enums.curve.brainpoolP512r1
};
var OID = class _OID {
  constructor(oid) {
    if (oid instanceof _OID) {
      this.oid = oid.oid;
    } else if (util.isArray(oid) || util.isUint8Array(oid)) {
      oid = new Uint8Array(oid);
      if (oid[0] === 6) {
        if (oid[1] !== oid.length - 2) {
          throw new Error("Length mismatch in DER encoded oid");
        }
        oid = oid.subarray(2);
      }
      this.oid = oid;
    } else {
      this.oid = "";
    }
  }
  /**
   * Method to read an OID object
   * @param {Uint8Array} input - Where to read the OID from
   * @returns {Number} Number of read bytes.
   */
  read(input) {
    if (input.length >= 1) {
      const length = input[0];
      if (input.length >= 1 + length) {
        this.oid = input.subarray(1, 1 + length);
        return 1 + this.oid.length;
      }
    }
    throw new Error("Invalid oid");
  }
  /**
   * Serialize an OID object
   * @returns {Uint8Array} Array with the serialized value the OID.
   */
  write() {
    return util.concatUint8Array([new Uint8Array([this.oid.length]), this.oid]);
  }
  /**
   * Serialize an OID object as a hex string
   * @returns {string} String with the hex value of the OID.
   */
  toHex() {
    return util.uint8ArrayToHex(this.oid);
  }
  /**
   * If a known curve object identifier, return the canonical name of the curve
   * @returns {enums.curve} String with the canonical name of the curve
   * @throws if unknown
   */
  getName() {
    const name2 = knownOIDs[this.toHex()];
    if (!name2) {
      throw new Error("Unknown curve object identifier.");
    }
    return name2;
  }
};
function readSimpleLength(bytes2) {
  let len = 0;
  let offset;
  const type = bytes2[0];
  if (type < 192) {
    [len] = bytes2;
    offset = 1;
  } else if (type < 255) {
    len = (bytes2[0] - 192 << 8) + bytes2[1] + 192;
    offset = 2;
  } else if (type === 255) {
    len = util.readNumber(bytes2.subarray(1, 1 + 4));
    offset = 5;
  }
  return {
    len,
    offset
  };
}
function writeSimpleLength(length) {
  if (length < 192) {
    return new Uint8Array([length]);
  } else if (length > 191 && length < 8384) {
    return new Uint8Array([(length - 192 >> 8) + 192, length - 192 & 255]);
  }
  return util.concatUint8Array([new Uint8Array([255]), util.writeNumber(length, 4)]);
}
function writePartialLength(power) {
  if (power < 0 || power > 30) {
    throw new Error("Partial Length power must be between 1 and 30");
  }
  return new Uint8Array([224 + power]);
}
function writeTag(tag_type) {
  return new Uint8Array([192 | tag_type]);
}
function writeHeader(tag_type, length) {
  return util.concatUint8Array([writeTag(tag_type), writeSimpleLength(length)]);
}
function supportsStreaming(tag) {
  return [
    enums.packet.literalData,
    enums.packet.compressedData,
    enums.packet.symmetricallyEncryptedData,
    enums.packet.symEncryptedIntegrityProtectedData,
    enums.packet.aeadEncryptedData
  ].includes(tag);
}
async function readPackets(input, callback) {
  const reader = getReader(input);
  let writer;
  let callbackReturned;
  try {
    const peekedBytes = await reader.peekBytes(2);
    if (!peekedBytes || peekedBytes.length < 2 || (peekedBytes[0] & 128) === 0) {
      throw new Error("Error during parsing. This message / key probably does not conform to a valid OpenPGP format.");
    }
    const headerByte = await reader.readByte();
    let tag = -1;
    let format = -1;
    let packetLength;
    format = 0;
    if ((headerByte & 64) !== 0) {
      format = 1;
    }
    let packetLengthType;
    if (format) {
      tag = headerByte & 63;
    } else {
      tag = (headerByte & 63) >> 2;
      packetLengthType = headerByte & 3;
    }
    const packetSupportsStreaming = supportsStreaming(tag);
    let packet = null;
    if (packetSupportsStreaming) {
      if (util.isStream(input) === "array") {
        const arrayStream = new ArrayStream();
        writer = getWriter(arrayStream);
        packet = arrayStream;
      } else {
        const transform2 = new TransformStream();
        writer = getWriter(transform2.writable);
        packet = transform2.readable;
      }
      callbackReturned = callback({ tag, packet });
    } else {
      packet = [];
    }
    let wasPartialLength;
    do {
      if (!format) {
        switch (packetLengthType) {
          case 0:
            packetLength = await reader.readByte();
            break;
          case 1:
            packetLength = await reader.readByte() << 8 | await reader.readByte();
            break;
          case 2:
            packetLength = await reader.readByte() << 24 | await reader.readByte() << 16 | await reader.readByte() << 8 | await reader.readByte();
            break;
          default:
            packetLength = Infinity;
            break;
        }
      } else {
        const lengthByte = await reader.readByte();
        wasPartialLength = false;
        if (lengthByte < 192) {
          packetLength = lengthByte;
        } else if (lengthByte >= 192 && lengthByte < 224) {
          packetLength = (lengthByte - 192 << 8) + await reader.readByte() + 192;
        } else if (lengthByte > 223 && lengthByte < 255) {
          packetLength = 1 << (lengthByte & 31);
          wasPartialLength = true;
          if (!packetSupportsStreaming) {
            throw new TypeError("This packet type does not support partial lengths.");
          }
        } else {
          packetLength = await reader.readByte() << 24 | await reader.readByte() << 16 | await reader.readByte() << 8 | await reader.readByte();
        }
      }
      if (packetLength > 0) {
        let bytesRead = 0;
        while (true) {
          if (writer) await writer.ready;
          const { done, value } = await reader.read();
          if (done) {
            if (packetLength === Infinity) break;
            throw new Error("Unexpected end of packet");
          }
          const chunk = packetLength === Infinity ? value : value.subarray(0, packetLength - bytesRead);
          if (writer) await writer.write(chunk);
          else packet.push(chunk);
          bytesRead += value.length;
          if (bytesRead >= packetLength) {
            reader.unshift(value.subarray(packetLength - bytesRead + value.length));
            break;
          }
        }
      }
    } while (wasPartialLength);
    const nextPacket = await reader.peekBytes(packetSupportsStreaming ? Infinity : 2);
    if (writer) {
      await writer.ready;
      await writer.close();
    } else {
      packet = util.concatUint8Array(packet);
      await callback({ tag, packet });
    }
    return !nextPacket || !nextPacket.length;
  } catch (e) {
    if (writer) {
      await writer.abort(e);
      return true;
    } else {
      throw e;
    }
  } finally {
    if (writer) {
      await callbackReturned;
    }
    reader.releaseLock();
  }
}
var UnsupportedError = class _UnsupportedError extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _UnsupportedError);
    }
    this.name = "UnsupportedError";
  }
};
var UnknownPacketError = class extends UnsupportedError {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnsupportedError);
    }
    this.name = "UnknownPacketError";
  }
};
var UnparseablePacket = class {
  constructor(tag, rawContent) {
    this.tag = tag;
    this.rawContent = rawContent;
  }
  write() {
    return this.rawContent;
  }
};
async function generate$3(algo) {
  switch (algo) {
    case enums.publicKey.ed25519:
      try {
        const webCrypto2 = util.getWebCrypto();
        const webCryptoKey = await webCrypto2.generateKey("Ed25519", true, ["sign", "verify"]);
        const privateKey = await webCrypto2.exportKey("jwk", webCryptoKey.privateKey);
        const publicKey = await webCrypto2.exportKey("jwk", webCryptoKey.publicKey);
        return {
          A: new Uint8Array(b64ToUint8Array(publicKey.x)),
          seed: b64ToUint8Array(privateKey.d, true)
        };
      } catch (err2) {
        if (err2.name !== "NotSupportedError" && err2.name !== "OperationError") {
          throw err2;
        }
        const seed = getRandomBytes(getPayloadSize$1(algo));
        const { publicKey: A2 } = nacl.sign.keyPair.fromSeed(seed);
        return { A: A2, seed };
      }
    case enums.publicKey.ed448: {
      const ed4482 = await util.getNobleCurve(enums.publicKey.ed448);
      const seed = ed4482.utils.randomPrivateKey();
      const A2 = ed4482.getPublicKey(seed);
      return { A: A2, seed };
    }
    default:
      throw new Error("Unsupported EdDSA algorithm");
  }
}
async function sign$5(algo, hashAlgo, message, publicKey, privateKey, hashed) {
  if (getHashByteLength(hashAlgo) < getHashByteLength(getPreferredHashAlgo$2(algo))) {
    throw new Error("Hash algorithm too weak for EdDSA.");
  }
  switch (algo) {
    case enums.publicKey.ed25519:
      try {
        const webCrypto2 = util.getWebCrypto();
        const jwk = privateKeyToJWK(algo, publicKey, privateKey);
        const key = await webCrypto2.importKey("jwk", jwk, "Ed25519", false, ["sign"]);
        const signature = new Uint8Array(
          await webCrypto2.sign("Ed25519", key, hashed)
        );
        return { RS: signature };
      } catch (err2) {
        if (err2.name !== "NotSupportedError") {
          throw err2;
        }
        const secretKey = util.concatUint8Array([privateKey, publicKey]);
        const signature = nacl.sign.detached(hashed, secretKey);
        return { RS: signature };
      }
    case enums.publicKey.ed448: {
      const ed4482 = await util.getNobleCurve(enums.publicKey.ed448);
      const signature = ed4482.sign(hashed, privateKey);
      return { RS: signature };
    }
    default:
      throw new Error("Unsupported EdDSA algorithm");
  }
}
async function verify$5(algo, hashAlgo, { RS }, m, publicKey, hashed) {
  if (getHashByteLength(hashAlgo) < getHashByteLength(getPreferredHashAlgo$2(algo))) {
    throw new Error("Hash algorithm too weak for EdDSA.");
  }
  switch (algo) {
    case enums.publicKey.ed25519:
      try {
        const webCrypto2 = util.getWebCrypto();
        const jwk = publicKeyToJWK(algo, publicKey);
        const key = await webCrypto2.importKey("jwk", jwk, "Ed25519", false, ["verify"]);
        const verified2 = await webCrypto2.verify("Ed25519", key, RS, hashed);
        return verified2;
      } catch (err2) {
        if (err2.name !== "NotSupportedError") {
          throw err2;
        }
        return nacl.sign.detached.verify(hashed, RS, publicKey);
      }
    case enums.publicKey.ed448: {
      const ed4482 = await util.getNobleCurve(enums.publicKey.ed448);
      return ed4482.verify(RS, hashed, publicKey);
    }
    default:
      throw new Error("Unsupported EdDSA algorithm");
  }
}
async function validateParams$7(algo, A2, seed) {
  switch (algo) {
    case enums.publicKey.ed25519: {
      const { publicKey } = nacl.sign.keyPair.fromSeed(seed);
      return util.equalsUint8Array(A2, publicKey);
    }
    case enums.publicKey.ed448: {
      const ed4482 = await util.getNobleCurve(enums.publicKey.ed448);
      const publicKey = ed4482.getPublicKey(seed);
      return util.equalsUint8Array(A2, publicKey);
    }
    default:
      return false;
  }
}
function getPayloadSize$1(algo) {
  switch (algo) {
    case enums.publicKey.ed25519:
      return 32;
    case enums.publicKey.ed448:
      return 57;
    default:
      throw new Error("Unsupported EdDSA algorithm");
  }
}
function getPreferredHashAlgo$2(algo) {
  switch (algo) {
    case enums.publicKey.ed25519:
      return enums.hash.sha256;
    case enums.publicKey.ed448:
      return enums.hash.sha512;
    default:
      throw new Error("Unknown EdDSA algo");
  }
}
var publicKeyToJWK = (algo, publicKey) => {
  switch (algo) {
    case enums.publicKey.ed25519: {
      const jwk = {
        kty: "OKP",
        crv: "Ed25519",
        x: uint8ArrayToB64(publicKey),
        ext: true
      };
      return jwk;
    }
    default:
      throw new Error("Unsupported EdDSA algorithm");
  }
};
var privateKeyToJWK = (algo, publicKey, privateKey) => {
  switch (algo) {
    case enums.publicKey.ed25519: {
      const jwk = publicKeyToJWK(algo, publicKey);
      jwk.d = uint8ArrayToB64(privateKey);
      return jwk;
    }
    default:
      throw new Error("Unsupported EdDSA algorithm");
  }
};
var eddsa = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  generate: generate$3,
  getPayloadSize: getPayloadSize$1,
  getPreferredHashAlgo: getPreferredHashAlgo$2,
  sign: sign$5,
  validateParams: validateParams$7,
  verify: verify$5
});
function isBytes$2(a) {
  return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
}
function bytes$1(b, ...lengths) {
  if (!isBytes$2(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
}
function exists$1(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function output$1(out, instance) {
  bytes$1(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error(`digestInto() expects output buffer of length at least ${min}`);
  }
}
var u8$1 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
var u32$2 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
var createView$1 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var isLE$1 = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
if (!isLE$1)
  throw new Error("Non little-endian hardware is not supported");
function utf8ToBytes$2(str) {
  if (typeof str !== "string")
    throw new Error(`string expected, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes$1(data) {
  if (typeof data === "string")
    data = utf8ToBytes$2(data);
  else if (isBytes$2(data))
    data = copyBytes(data);
  else
    throw new Error(`Uint8Array expected, got ${typeof data}`);
  return data;
}
function concatBytes$2(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    bytes$1(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad2 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad2);
    pad2 += a.length;
  }
  return res;
}
function equalBytes$1(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, c) => {
  Object.assign(c, params);
  return c;
};
function setBigUint64$1(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = 0;
  const l = 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}
function isAligned32(bytes2) {
  return bytes2.byteOffset % 4 === 0;
}
function copyBytes(bytes2) {
  return Uint8Array.from(bytes2);
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
var BLOCK_SIZE$1 = 16;
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var ZEROS32 = u32$2(ZEROS16);
var POLY$1 = 225;
var mul2$1 = (s0, s1, s2, s3) => {
  const hiBit = s3 & 1;
  return {
    s3: s2 << 31 | s3 >>> 1,
    s2: s1 << 31 | s2 >>> 1,
    s1: s0 << 31 | s1 >>> 1,
    s0: s0 >>> 1 ^ POLY$1 << 24 & -(hiBit & 1)
    // reduce % poly
  };
};
var swapLE = (n) => (n >>> 0 & 255) << 24 | (n >>> 8 & 255) << 16 | (n >>> 16 & 255) << 8 | n >>> 24 & 255 | 0;
function _toGHASHKey(k) {
  k.reverse();
  const hiBit = k[15] & 1;
  let carry = 0;
  for (let i = 0; i < k.length; i++) {
    const t = k[i];
    k[i] = t >>> 1 | carry;
    carry = (t & 1) << 7;
  }
  k[0] ^= -hiBit & 225;
  return k;
}
var estimateWindow = (bytes2) => {
  if (bytes2 > 64 * 1024)
    return 8;
  if (bytes2 > 1024)
    return 4;
  return 2;
};
var GHASH = class {
  // We select bits per window adaptively based on expectedLength
  constructor(key, expectedLength) {
    this.blockLen = BLOCK_SIZE$1;
    this.outputLen = BLOCK_SIZE$1;
    this.s0 = 0;
    this.s1 = 0;
    this.s2 = 0;
    this.s3 = 0;
    this.finished = false;
    key = toBytes$1(key);
    bytes$1(key, 16);
    const kView = createView$1(key);
    let k0 = kView.getUint32(0, false);
    let k1 = kView.getUint32(4, false);
    let k2 = kView.getUint32(8, false);
    let k3 = kView.getUint32(12, false);
    const doubles = [];
    for (let i = 0; i < 128; i++) {
      doubles.push({ s0: swapLE(k0), s1: swapLE(k1), s2: swapLE(k2), s3: swapLE(k3) });
      ({ s0: k0, s1: k1, s2: k2, s3: k3 } = mul2$1(k0, k1, k2, k3));
    }
    const W = estimateWindow(expectedLength || 1024);
    if (![1, 2, 4, 8].includes(W))
      throw new Error(`ghash: wrong window size=${W}, should be 2, 4 or 8`);
    this.W = W;
    const bits2 = 128;
    const windows = bits2 / W;
    const windowSize = this.windowSize = 2 ** W;
    const items = [];
    for (let w = 0; w < windows; w++) {
      for (let byte = 0; byte < windowSize; byte++) {
        let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
        for (let j = 0; j < W; j++) {
          const bit = byte >>> W - j - 1 & 1;
          if (!bit)
            continue;
          const { s0: d0, s1: d1, s2: d2, s3: d3 } = doubles[W * w + j];
          s0 ^= d0, s1 ^= d1, s2 ^= d2, s3 ^= d3;
        }
        items.push({ s0, s1, s2, s3 });
      }
    }
    this.t = items;
  }
  _updateBlock(s0, s1, s2, s3) {
    s0 ^= this.s0, s1 ^= this.s1, s2 ^= this.s2, s3 ^= this.s3;
    const { W, t, windowSize } = this;
    let o0 = 0, o1 = 0, o2 = 0, o3 = 0;
    const mask = (1 << W) - 1;
    let w = 0;
    for (const num of [s0, s1, s2, s3]) {
      for (let bytePos = 0; bytePos < 4; bytePos++) {
        const byte = num >>> 8 * bytePos & 255;
        for (let bitPos = 8 / W - 1; bitPos >= 0; bitPos--) {
          const bit = byte >>> W * bitPos & mask;
          const { s0: e0, s1: e1, s2: e2, s3: e3 } = t[w * windowSize + bit];
          o0 ^= e0, o1 ^= e1, o2 ^= e2, o3 ^= e3;
          w += 1;
        }
      }
    }
    this.s0 = o0;
    this.s1 = o1;
    this.s2 = o2;
    this.s3 = o3;
  }
  update(data) {
    data = toBytes$1(data);
    exists$1(this);
    const b32 = u32$2(data);
    const blocks = Math.floor(data.length / BLOCK_SIZE$1);
    const left = data.length % BLOCK_SIZE$1;
    for (let i = 0; i < blocks; i++) {
      this._updateBlock(b32[i * 4 + 0], b32[i * 4 + 1], b32[i * 4 + 2], b32[i * 4 + 3]);
    }
    if (left) {
      ZEROS16.set(data.subarray(blocks * BLOCK_SIZE$1));
      this._updateBlock(ZEROS32[0], ZEROS32[1], ZEROS32[2], ZEROS32[3]);
      clean(ZEROS32);
    }
    return this;
  }
  destroy() {
    const { t } = this;
    for (const elm of t) {
      elm.s0 = 0, elm.s1 = 0, elm.s2 = 0, elm.s3 = 0;
    }
  }
  digestInto(out) {
    exists$1(this);
    output$1(out, this);
    this.finished = true;
    const { s0, s1, s2, s3 } = this;
    const o32 = u32$2(out);
    o32[0] = s0;
    o32[1] = s1;
    o32[2] = s2;
    o32[3] = s3;
    return out;
  }
  digest() {
    const res = new Uint8Array(BLOCK_SIZE$1);
    this.digestInto(res);
    this.destroy();
    return res;
  }
};
var Polyval = class extends GHASH {
  constructor(key, expectedLength) {
    key = toBytes$1(key);
    const ghKey = _toGHASHKey(copyBytes(key));
    super(ghKey, expectedLength);
    clean(ghKey);
  }
  update(data) {
    data = toBytes$1(data);
    exists$1(this);
    const b32 = u32$2(data);
    const left = data.length % BLOCK_SIZE$1;
    const blocks = Math.floor(data.length / BLOCK_SIZE$1);
    for (let i = 0; i < blocks; i++) {
      this._updateBlock(swapLE(b32[i * 4 + 3]), swapLE(b32[i * 4 + 2]), swapLE(b32[i * 4 + 1]), swapLE(b32[i * 4 + 0]));
    }
    if (left) {
      ZEROS16.set(data.subarray(blocks * BLOCK_SIZE$1));
      this._updateBlock(swapLE(ZEROS32[3]), swapLE(ZEROS32[2]), swapLE(ZEROS32[1]), swapLE(ZEROS32[0]));
      clean(ZEROS32);
    }
    return this;
  }
  digestInto(out) {
    exists$1(this);
    output$1(out, this);
    this.finished = true;
    const { s0, s1, s2, s3 } = this;
    const o32 = u32$2(out);
    o32[0] = s0;
    o32[1] = s1;
    o32[2] = s2;
    o32[3] = s3;
    return out.reverse();
  }
};
function wrapConstructorWithKey(hashCons) {
  const hashC = (msg, key) => hashCons(key, msg.length).update(toBytes$1(msg)).digest();
  const tmp = hashCons(new Uint8Array(16), 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (key, expectedLength) => hashCons(key, expectedLength);
  return hashC;
}
var ghash = wrapConstructorWithKey((key, expectedLength) => new GHASH(key, expectedLength));
wrapConstructorWithKey((key, expectedLength) => new Polyval(key, expectedLength));
var BLOCK_SIZE = 16;
var BLOCK_SIZE32 = 4;
var EMPTY_BLOCK = new Uint8Array(BLOCK_SIZE);
var POLY = 283;
function mul2(n) {
  return n << 1 ^ POLY & -(n >> 7);
}
function mul(a, b) {
  let res = 0;
  for (; b > 0; b >>= 1) {
    res ^= a & -(b & 1);
    a = mul2(a);
  }
  return res;
}
var sbox = /* @__PURE__ */ (() => {
  const t = new Uint8Array(256);
  for (let i = 0, x = 1; i < 256; i++, x ^= mul2(x))
    t[i] = x;
  const box = new Uint8Array(256);
  box[0] = 99;
  for (let i = 0; i < 255; i++) {
    let x = t[255 - i];
    x |= x << 8;
    box[t[i]] = (x ^ x >> 4 ^ x >> 5 ^ x >> 6 ^ x >> 7 ^ 99) & 255;
  }
  clean(t);
  return box;
})();
var invSbox = /* @__PURE__ */ sbox.map((_, j) => sbox.indexOf(j));
var rotr32_8 = (n) => n << 24 | n >>> 8;
var rotl32_8 = (n) => n << 8 | n >>> 24;
var byteSwap$1 = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
function genTtable(sbox2, fn) {
  if (sbox2.length !== 256)
    throw new Error("Wrong sbox length");
  const T0 = new Uint32Array(256).map((_, j) => fn(sbox2[j]));
  const T1 = T0.map(rotl32_8);
  const T2 = T1.map(rotl32_8);
  const T3 = T2.map(rotl32_8);
  const T01 = new Uint32Array(256 * 256);
  const T23 = new Uint32Array(256 * 256);
  const sbox22 = new Uint16Array(256 * 256);
  for (let i = 0; i < 256; i++) {
    for (let j = 0; j < 256; j++) {
      const idx = i * 256 + j;
      T01[idx] = T0[i] ^ T1[j];
      T23[idx] = T2[i] ^ T3[j];
      sbox22[idx] = sbox2[i] << 8 | sbox2[j];
    }
  }
  return { sbox: sbox2, sbox2: sbox22, T0, T1, T2, T3, T01, T23 };
}
var tableEncoding = /* @__PURE__ */ genTtable(sbox, (s) => mul(s, 3) << 24 | s << 16 | s << 8 | mul(s, 2));
var tableDecoding = /* @__PURE__ */ genTtable(invSbox, (s) => mul(s, 11) << 24 | mul(s, 13) << 16 | mul(s, 9) << 8 | mul(s, 14));
var xPowers = /* @__PURE__ */ (() => {
  const p = new Uint8Array(16);
  for (let i = 0, x = 1; i < 16; i++, x = mul2(x))
    p[i] = x;
  return p;
})();
function expandKeyLE(key) {
  bytes$1(key);
  const len = key.length;
  if (![16, 24, 32].includes(len))
    throw new Error(`aes: wrong key size: should be 16, 24 or 32, got: ${len}`);
  const { sbox2 } = tableEncoding;
  const toClean = [];
  if (!isAligned32(key))
    toClean.push(key = copyBytes(key));
  const k32 = u32$2(key);
  const Nk = k32.length;
  const subByte = (n) => applySbox(sbox2, n, n, n, n);
  const xk = new Uint32Array(len + 28);
  xk.set(k32);
  for (let i = Nk; i < xk.length; i++) {
    let t = xk[i - 1];
    if (i % Nk === 0)
      t = subByte(rotr32_8(t)) ^ xPowers[i / Nk - 1];
    else if (Nk > 6 && i % Nk === 4)
      t = subByte(t);
    xk[i] = xk[i - Nk] ^ t;
  }
  clean(...toClean);
  return xk;
}
function expandKeyDecLE(key) {
  const encKey = expandKeyLE(key);
  const xk = encKey.slice();
  const Nk = encKey.length;
  const { sbox2 } = tableEncoding;
  const { T0, T1, T2, T3 } = tableDecoding;
  for (let i = 0; i < Nk; i += 4) {
    for (let j = 0; j < 4; j++)
      xk[i + j] = encKey[Nk - i - 4 + j];
  }
  clean(encKey);
  for (let i = 4; i < Nk - 4; i++) {
    const x = xk[i];
    const w = applySbox(sbox2, x, x, x, x);
    xk[i] = T0[w & 255] ^ T1[w >>> 8 & 255] ^ T2[w >>> 16 & 255] ^ T3[w >>> 24];
  }
  return xk;
}
function apply0123(T01, T23, s0, s1, s2, s3) {
  return T01[s0 << 8 & 65280 | s1 >>> 8 & 255] ^ T23[s2 >>> 8 & 65280 | s3 >>> 24 & 255];
}
function applySbox(sbox2, s0, s1, s2, s3) {
  return sbox2[s0 & 255 | s1 & 65280] | sbox2[s2 >>> 16 & 255 | s3 >>> 16 & 65280] << 16;
}
function encrypt$4(xk, s0, s1, s2, s3) {
  const { sbox2, T01, T23 } = tableEncoding;
  let k = 0;
  s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
  const rounds = xk.length / 4 - 2;
  for (let i = 0; i < rounds; i++) {
    const t02 = xk[k++] ^ apply0123(T01, T23, s0, s1, s2, s3);
    const t12 = xk[k++] ^ apply0123(T01, T23, s1, s2, s3, s0);
    const t22 = xk[k++] ^ apply0123(T01, T23, s2, s3, s0, s1);
    const t32 = xk[k++] ^ apply0123(T01, T23, s3, s0, s1, s2);
    s0 = t02, s1 = t12, s2 = t22, s3 = t32;
  }
  const t0 = xk[k++] ^ applySbox(sbox2, s0, s1, s2, s3);
  const t1 = xk[k++] ^ applySbox(sbox2, s1, s2, s3, s0);
  const t2 = xk[k++] ^ applySbox(sbox2, s2, s3, s0, s1);
  const t3 = xk[k++] ^ applySbox(sbox2, s3, s0, s1, s2);
  return { s0: t0, s1: t1, s2: t2, s3: t3 };
}
function decrypt$4(xk, s0, s1, s2, s3) {
  const { sbox2, T01, T23 } = tableDecoding;
  let k = 0;
  s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
  const rounds = xk.length / 4 - 2;
  for (let i = 0; i < rounds; i++) {
    const t02 = xk[k++] ^ apply0123(T01, T23, s0, s3, s2, s1);
    const t12 = xk[k++] ^ apply0123(T01, T23, s1, s0, s3, s2);
    const t22 = xk[k++] ^ apply0123(T01, T23, s2, s1, s0, s3);
    const t32 = xk[k++] ^ apply0123(T01, T23, s3, s2, s1, s0);
    s0 = t02, s1 = t12, s2 = t22, s3 = t32;
  }
  const t0 = xk[k++] ^ applySbox(sbox2, s0, s3, s2, s1);
  const t1 = xk[k++] ^ applySbox(sbox2, s1, s0, s3, s2);
  const t2 = xk[k++] ^ applySbox(sbox2, s2, s1, s0, s3);
  const t3 = xk[k++] ^ applySbox(sbox2, s3, s2, s1, s0);
  return { s0: t0, s1: t1, s2: t2, s3: t3 };
}
function getDst(len, dst) {
  if (dst === void 0)
    return new Uint8Array(len);
  bytes$1(dst);
  if (dst.length < len)
    throw new Error(`aes: wrong destination length, expected at least ${len}, got: ${dst.length}`);
  if (!isAligned32(dst))
    throw new Error("unaligned dst");
  return dst;
}
function ctrCounter(xk, nonce, src, dst) {
  bytes$1(nonce, BLOCK_SIZE);
  bytes$1(src);
  const srcLen = src.length;
  dst = getDst(srcLen, dst);
  const ctr3 = nonce;
  const c32 = u32$2(ctr3);
  let { s0, s1, s2, s3 } = encrypt$4(xk, c32[0], c32[1], c32[2], c32[3]);
  const src32 = u32$2(src);
  const dst32 = u32$2(dst);
  for (let i = 0; i + 4 <= src32.length; i += 4) {
    dst32[i + 0] = src32[i + 0] ^ s0;
    dst32[i + 1] = src32[i + 1] ^ s1;
    dst32[i + 2] = src32[i + 2] ^ s2;
    dst32[i + 3] = src32[i + 3] ^ s3;
    let carry = 1;
    for (let i2 = ctr3.length - 1; i2 >= 0; i2--) {
      carry = carry + (ctr3[i2] & 255) | 0;
      ctr3[i2] = carry & 255;
      carry >>>= 8;
    }
    ({ s0, s1, s2, s3 } = encrypt$4(xk, c32[0], c32[1], c32[2], c32[3]));
  }
  const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
  if (start < srcLen) {
    const b32 = new Uint32Array([s0, s1, s2, s3]);
    const buf = u8$1(b32);
    for (let i = start, pos2 = 0; i < srcLen; i++, pos2++)
      dst[i] = src[i] ^ buf[pos2];
    clean(b32);
  }
  return dst;
}
function ctr32(xk, isLE2, nonce, src, dst) {
  bytes$1(nonce, BLOCK_SIZE);
  bytes$1(src);
  dst = getDst(src.length, dst);
  const ctr3 = nonce;
  const c32 = u32$2(ctr3);
  const view = createView$1(ctr3);
  const src32 = u32$2(src);
  const dst32 = u32$2(dst);
  const ctrPos = isLE2 ? 0 : 12;
  const srcLen = src.length;
  let ctrNum = view.getUint32(ctrPos, isLE2);
  let { s0, s1, s2, s3 } = encrypt$4(xk, c32[0], c32[1], c32[2], c32[3]);
  for (let i = 0; i + 4 <= src32.length; i += 4) {
    dst32[i + 0] = src32[i + 0] ^ s0;
    dst32[i + 1] = src32[i + 1] ^ s1;
    dst32[i + 2] = src32[i + 2] ^ s2;
    dst32[i + 3] = src32[i + 3] ^ s3;
    ctrNum = ctrNum + 1 >>> 0;
    view.setUint32(ctrPos, ctrNum, isLE2);
    ({ s0, s1, s2, s3 } = encrypt$4(xk, c32[0], c32[1], c32[2], c32[3]));
  }
  const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
  if (start < srcLen) {
    const b32 = new Uint32Array([s0, s1, s2, s3]);
    const buf = u8$1(b32);
    for (let i = start, pos2 = 0; i < srcLen; i++, pos2++)
      dst[i] = src[i] ^ buf[pos2];
    clean(b32);
  }
  return dst;
}
var ctr = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 16 }, function ctr2(key, nonce) {
  bytes$1(key);
  bytes$1(nonce, BLOCK_SIZE);
  function processCtr(buf, dst) {
    bytes$1(buf);
    if (dst !== void 0) {
      bytes$1(dst);
      if (!isAligned32(dst))
        throw new Error("unaligned destination");
    }
    const xk = expandKeyLE(key);
    const n = copyBytes(nonce);
    const toClean = [xk, n];
    if (!isAligned32(buf))
      toClean.push(buf = copyBytes(buf));
    const out = ctrCounter(xk, n, buf, dst);
    clean(...toClean);
    return out;
  }
  return {
    encrypt: (plaintext, dst) => processCtr(plaintext, dst),
    decrypt: (ciphertext, dst) => processCtr(ciphertext, dst)
  };
});
function validateBlockDecrypt(data) {
  bytes$1(data);
  if (data.length % BLOCK_SIZE !== 0) {
    throw new Error(`aes/(cbc-ecb).decrypt ciphertext should consist of blocks with size ${BLOCK_SIZE}`);
  }
}
function validateBlockEncrypt(plaintext, pcks5, dst) {
  bytes$1(plaintext);
  let outLen = plaintext.length;
  const remaining = outLen % BLOCK_SIZE;
  if (!pcks5 && remaining !== 0)
    throw new Error("aec/(cbc-ecb): unpadded plaintext with disabled padding");
  if (!isAligned32(plaintext))
    plaintext = copyBytes(plaintext);
  const b = u32$2(plaintext);
  if (pcks5) {
    let left = BLOCK_SIZE - remaining;
    if (!left)
      left = BLOCK_SIZE;
    outLen = outLen + left;
  }
  const out = getDst(outLen, dst);
  const o = u32$2(out);
  return { b, o, out };
}
function validatePCKS(data, pcks5) {
  if (!pcks5)
    return data;
  const len = data.length;
  if (!len)
    throw new Error("aes/pcks5: empty ciphertext not allowed");
  const lastByte = data[len - 1];
  if (lastByte <= 0 || lastByte > 16)
    throw new Error("aes/pcks5: wrong padding");
  const out = data.subarray(0, -lastByte);
  for (let i = 0; i < lastByte; i++)
    if (data[len - i - 1] !== lastByte)
      throw new Error("aes/pcks5: wrong padding");
  return out;
}
function padPCKS(left) {
  const tmp = new Uint8Array(16);
  const tmp32 = u32$2(tmp);
  tmp.set(left);
  const paddingByte = BLOCK_SIZE - left.length;
  for (let i = BLOCK_SIZE - paddingByte; i < BLOCK_SIZE; i++)
    tmp[i] = paddingByte;
  return tmp32;
}
var cbc = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 16 }, function cbc2(key, iv, opts = {}) {
  bytes$1(key);
  bytes$1(iv, 16);
  const pcks5 = !opts.disablePadding;
  return {
    encrypt(plaintext, dst) {
      const xk = expandKeyLE(key);
      const { b, o, out: _out } = validateBlockEncrypt(plaintext, pcks5, dst);
      let _iv = iv;
      const toClean = [xk];
      if (!isAligned32(_iv))
        toClean.push(_iv = copyBytes(_iv));
      const n32 = u32$2(_iv);
      let s0 = n32[0], s1 = n32[1], s2 = n32[2], s3 = n32[3];
      let i = 0;
      for (; i + 4 <= b.length; ) {
        s0 ^= b[i + 0], s1 ^= b[i + 1], s2 ^= b[i + 2], s3 ^= b[i + 3];
        ({ s0, s1, s2, s3 } = encrypt$4(xk, s0, s1, s2, s3));
        o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
      }
      if (pcks5) {
        const tmp32 = padPCKS(plaintext.subarray(i * 4));
        s0 ^= tmp32[0], s1 ^= tmp32[1], s2 ^= tmp32[2], s3 ^= tmp32[3];
        ({ s0, s1, s2, s3 } = encrypt$4(xk, s0, s1, s2, s3));
        o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
      }
      clean(...toClean);
      return _out;
    },
    decrypt(ciphertext, dst) {
      validateBlockDecrypt(ciphertext);
      const xk = expandKeyDecLE(key);
      let _iv = iv;
      const toClean = [xk];
      if (!isAligned32(_iv))
        toClean.push(_iv = copyBytes(_iv));
      const n32 = u32$2(_iv);
      const out = getDst(ciphertext.length, dst);
      if (!isAligned32(ciphertext))
        toClean.push(ciphertext = copyBytes(ciphertext));
      const b = u32$2(ciphertext);
      const o = u32$2(out);
      let s0 = n32[0], s1 = n32[1], s2 = n32[2], s3 = n32[3];
      for (let i = 0; i + 4 <= b.length; ) {
        const ps0 = s0, ps1 = s1, ps2 = s2, ps3 = s3;
        s0 = b[i + 0], s1 = b[i + 1], s2 = b[i + 2], s3 = b[i + 3];
        const { s0: o0, s1: o1, s2: o2, s3: o3 } = decrypt$4(xk, s0, s1, s2, s3);
        o[i++] = o0 ^ ps0, o[i++] = o1 ^ ps1, o[i++] = o2 ^ ps2, o[i++] = o3 ^ ps3;
      }
      clean(...toClean);
      return validatePCKS(out, pcks5);
    }
  };
});
var cfb = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 16 }, function cfb2(key, iv) {
  bytes$1(key);
  bytes$1(iv, 16);
  function processCfb(src, isEncrypt, dst) {
    bytes$1(src);
    const srcLen = src.length;
    dst = getDst(srcLen, dst);
    const xk = expandKeyLE(key);
    let _iv = iv;
    const toClean = [xk];
    if (!isAligned32(_iv))
      toClean.push(_iv = copyBytes(_iv));
    if (!isAligned32(src))
      toClean.push(src = copyBytes(src));
    const src32 = u32$2(src);
    const dst32 = u32$2(dst);
    const next32 = isEncrypt ? dst32 : src32;
    const n32 = u32$2(_iv);
    let s0 = n32[0], s1 = n32[1], s2 = n32[2], s3 = n32[3];
    for (let i = 0; i + 4 <= src32.length; ) {
      const { s0: e0, s1: e1, s2: e2, s3: e3 } = encrypt$4(xk, s0, s1, s2, s3);
      dst32[i + 0] = src32[i + 0] ^ e0;
      dst32[i + 1] = src32[i + 1] ^ e1;
      dst32[i + 2] = src32[i + 2] ^ e2;
      dst32[i + 3] = src32[i + 3] ^ e3;
      s0 = next32[i++], s1 = next32[i++], s2 = next32[i++], s3 = next32[i++];
    }
    const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
    if (start < srcLen) {
      ({ s0, s1, s2, s3 } = encrypt$4(xk, s0, s1, s2, s3));
      const buf = u8$1(new Uint32Array([s0, s1, s2, s3]));
      for (let i = start, pos2 = 0; i < srcLen; i++, pos2++)
        dst[i] = src[i] ^ buf[pos2];
      clean(buf);
    }
    clean(...toClean);
    return dst;
  }
  return {
    encrypt: (plaintext, dst) => processCfb(plaintext, true, dst),
    decrypt: (ciphertext, dst) => processCfb(ciphertext, false, dst)
  };
});
function computeTag(fn, isLE2, key, data, AAD) {
  const aadLength = AAD == null ? 0 : AAD.length;
  const h = fn.create(key, data.length + aadLength);
  if (AAD)
    h.update(AAD);
  h.update(data);
  const num = new Uint8Array(16);
  const view = createView$1(num);
  if (AAD)
    setBigUint64$1(view, 0, BigInt(aadLength * 8), isLE2);
  setBigUint64$1(view, 8, BigInt(data.length * 8), isLE2);
  h.update(num);
  const res = h.digest();
  clean(num);
  return res;
}
var gcm = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 12, tagLength: 16 }, function gcm2(key, nonce, AAD) {
  bytes$1(key);
  bytes$1(nonce);
  if (AAD !== void 0)
    bytes$1(AAD);
  if (nonce.length < 8)
    throw new Error("aes/gcm: invalid nonce length");
  const tagLength2 = 16;
  function _computeTag(authKey, tagMask, data) {
    const tag = computeTag(ghash, false, authKey, data, AAD);
    for (let i = 0; i < tagMask.length; i++)
      tag[i] ^= tagMask[i];
    return tag;
  }
  function deriveKeys() {
    const xk = expandKeyLE(key);
    const authKey = EMPTY_BLOCK.slice();
    const counter = EMPTY_BLOCK.slice();
    ctr32(xk, false, counter, counter, authKey);
    if (nonce.length === 12) {
      counter.set(nonce);
    } else {
      const nonceLen = EMPTY_BLOCK.slice();
      const view = createView$1(nonceLen);
      setBigUint64$1(view, 8, BigInt(nonce.length * 8), false);
      const g = ghash.create(authKey).update(nonce).update(nonceLen);
      g.digestInto(counter);
      g.destroy();
    }
    const tagMask = ctr32(xk, false, counter, EMPTY_BLOCK);
    return { xk, authKey, counter, tagMask };
  }
  return {
    encrypt(plaintext) {
      bytes$1(plaintext);
      const { xk, authKey, counter, tagMask } = deriveKeys();
      const out = new Uint8Array(plaintext.length + tagLength2);
      const toClean = [xk, authKey, counter, tagMask];
      if (!isAligned32(plaintext))
        toClean.push(plaintext = copyBytes(plaintext));
      ctr32(xk, false, counter, plaintext, out);
      const tag = _computeTag(authKey, tagMask, out.subarray(0, out.length - tagLength2));
      toClean.push(tag);
      out.set(tag, plaintext.length);
      clean(...toClean);
      return out;
    },
    decrypt(ciphertext) {
      bytes$1(ciphertext);
      if (ciphertext.length < tagLength2)
        throw new Error(`aes/gcm: ciphertext less than tagLen (${tagLength2})`);
      const { xk, authKey, counter, tagMask } = deriveKeys();
      const toClean = [xk, authKey, tagMask, counter];
      if (!isAligned32(ciphertext))
        toClean.push(ciphertext = copyBytes(ciphertext));
      const data = ciphertext.subarray(0, -tagLength2);
      const passedTag = ciphertext.subarray(-tagLength2);
      const tag = _computeTag(authKey, tagMask, data);
      toClean.push(tag);
      if (!equalBytes$1(tag, passedTag))
        throw new Error("aes/gcm: invalid ghash tag");
      const out = ctr32(xk, false, counter, data);
      clean(...toClean);
      return out;
    }
  };
});
function isBytes32(a) {
  return a != null && typeof a === "object" && (a instanceof Uint32Array || a.constructor.name === "Uint32Array");
}
function encryptBlock(xk, block) {
  bytes$1(block, 16);
  if (!isBytes32(xk))
    throw new Error("_encryptBlock accepts result of expandKeyLE");
  const b32 = u32$2(block);
  let { s0, s1, s2, s3 } = encrypt$4(xk, b32[0], b32[1], b32[2], b32[3]);
  b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
  return block;
}
function decryptBlock(xk, block) {
  bytes$1(block, 16);
  if (!isBytes32(xk))
    throw new Error("_decryptBlock accepts result of expandKeyLE");
  const b32 = u32$2(block);
  let { s0, s1, s2, s3 } = decrypt$4(xk, b32[0], b32[1], b32[2], b32[3]);
  b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
  return block;
}
var AESW = {
  /*
  High-level pseudocode:
  ```
  A: u64 = IV
  out = []
  for (let i=0, ctr = 0; i<6; i++) {
    for (const chunk of chunks(plaintext, 8)) {
      A ^= swapEndianess(ctr++)
      [A, res] = chunks(encrypt(A || chunk), 8);
      out ||= res
    }
  }
  out = A || out
  ```
  Decrypt is the same, but reversed.
  */
  encrypt(kek, out) {
    if (out.length >= 2 ** 32)
      throw new Error("plaintext should be less than 4gb");
    const xk = expandKeyLE(kek);
    if (out.length === 16)
      encryptBlock(xk, out);
    else {
      const o32 = u32$2(out);
      let a0 = o32[0], a1 = o32[1];
      for (let j = 0, ctr3 = 1; j < 6; j++) {
        for (let pos2 = 2; pos2 < o32.length; pos2 += 2, ctr3++) {
          const { s0, s1, s2, s3 } = encrypt$4(xk, a0, a1, o32[pos2], o32[pos2 + 1]);
          a0 = s0, a1 = s1 ^ byteSwap$1(ctr3), o32[pos2] = s2, o32[pos2 + 1] = s3;
        }
      }
      o32[0] = a0, o32[1] = a1;
    }
    xk.fill(0);
  },
  decrypt(kek, out) {
    if (out.length - 8 >= 2 ** 32)
      throw new Error("ciphertext should be less than 4gb");
    const xk = expandKeyDecLE(kek);
    const chunks = out.length / 8 - 1;
    if (chunks === 1)
      decryptBlock(xk, out);
    else {
      const o32 = u32$2(out);
      let a0 = o32[0], a1 = o32[1];
      for (let j = 0, ctr3 = chunks * 6; j < 6; j++) {
        for (let pos2 = chunks * 2; pos2 >= 1; pos2 -= 2, ctr3--) {
          a1 ^= byteSwap$1(ctr3);
          const { s0, s1, s2, s3 } = decrypt$4(xk, a0, a1, o32[pos2], o32[pos2 + 1]);
          a0 = s0, a1 = s1, o32[pos2] = s2, o32[pos2 + 1] = s3;
        }
      }
      o32[0] = a0, o32[1] = a1;
    }
    xk.fill(0);
  }
};
var AESKW_IV = new Uint8Array(8).fill(166);
var aeskw = /* @__PURE__ */ wrapCipher({ blockSize: 8 }, (kek) => ({
  encrypt(plaintext) {
    bytes$1(plaintext);
    if (!plaintext.length || plaintext.length % 8 !== 0)
      throw new Error("invalid plaintext length");
    if (plaintext.length === 8)
      throw new Error("8-byte keys not allowed in AESKW, use AESKWP instead");
    const out = concatBytes$2(AESKW_IV, plaintext);
    AESW.encrypt(kek, out);
    return out;
  },
  decrypt(ciphertext) {
    bytes$1(ciphertext);
    if (ciphertext.length % 8 !== 0 || ciphertext.length < 3 * 8)
      throw new Error("invalid ciphertext length");
    const out = copyBytes(ciphertext);
    AESW.decrypt(kek, out);
    if (!equalBytes$1(out.subarray(0, 8), AESKW_IV))
      throw new Error("integrity check failed");
    out.subarray(0, 8).fill(0);
    return out.subarray(8);
  }
}));
var unsafe = {
  expandKeyLE,
  expandKeyDecLE,
  encrypt: encrypt$4,
  decrypt: decrypt$4,
  encryptBlock,
  decryptBlock,
  ctrCounter,
  ctr32
};
async function getLegacyCipher(algo) {
  switch (algo) {
    case enums.symmetric.aes128:
    case enums.symmetric.aes192:
    case enums.symmetric.aes256:
      throw new Error("Not a legacy cipher");
    case enums.symmetric.cast5:
    case enums.symmetric.blowfish:
    case enums.symmetric.twofish:
    case enums.symmetric.tripledes: {
      const { legacyCiphers: legacyCiphers2 } = await Promise.resolve().then(function() {
        return legacy_ciphers;
      });
      const algoName = enums.read(enums.symmetric, algo);
      const cipher = legacyCiphers2.get(algoName);
      if (!cipher) {
        throw new Error("Unsupported cipher algorithm");
      }
      return cipher;
    }
    default:
      throw new Error("Unsupported cipher algorithm");
  }
}
function getCipherBlockSize(algo) {
  switch (algo) {
    case enums.symmetric.aes128:
    case enums.symmetric.aes192:
    case enums.symmetric.aes256:
    case enums.symmetric.twofish:
      return 16;
    case enums.symmetric.blowfish:
    case enums.symmetric.cast5:
    case enums.symmetric.tripledes:
      return 8;
    default:
      throw new Error("Unsupported cipher");
  }
}
function getCipherKeySize(algo) {
  switch (algo) {
    case enums.symmetric.aes128:
    case enums.symmetric.blowfish:
    case enums.symmetric.cast5:
      return 16;
    case enums.symmetric.aes192:
    case enums.symmetric.tripledes:
      return 24;
    case enums.symmetric.aes256:
    case enums.symmetric.twofish:
      return 32;
    default:
      throw new Error("Unsupported cipher");
  }
}
function getCipherParams(algo) {
  return { keySize: getCipherKeySize(algo), blockSize: getCipherBlockSize(algo) };
}
var webCrypto$8 = util.getWebCrypto();
async function wrap(algo, key, dataToWrap) {
  const { keySize } = getCipherParams(algo);
  if (!util.isAES(algo) || key.length !== keySize) {
    throw new Error("Unexpected algorithm or key size");
  }
  try {
    const wrappingKey = await webCrypto$8.importKey("raw", key, { name: "AES-KW" }, false, ["wrapKey"]);
    const keyToWrap = await webCrypto$8.importKey("raw", dataToWrap, { name: "HMAC", hash: "SHA-256" }, true, ["sign"]);
    const wrapped = await webCrypto$8.wrapKey("raw", keyToWrap, wrappingKey, { name: "AES-KW" });
    return new Uint8Array(wrapped);
  } catch (err2) {
    if (err2.name !== "NotSupportedError" && !(key.length === 24 && err2.name === "OperationError")) {
      throw err2;
    }
    util.printDebugError("Browser did not support operation: " + err2.message);
  }
  return aeskw(key).encrypt(dataToWrap);
}
async function unwrap(algo, key, wrappedData) {
  const { keySize } = getCipherParams(algo);
  if (!util.isAES(algo) || key.length !== keySize) {
    throw new Error("Unexpected algorithm or key size");
  }
  let wrappingKey;
  try {
    wrappingKey = await webCrypto$8.importKey("raw", key, { name: "AES-KW" }, false, ["unwrapKey"]);
  } catch (err2) {
    if (err2.name !== "NotSupportedError" && !(key.length === 24 && err2.name === "OperationError")) {
      throw err2;
    }
    util.printDebugError("Browser did not support operation: " + err2.message);
    return aeskw(key).decrypt(wrappedData);
  }
  try {
    const unwrapped = await webCrypto$8.unwrapKey("raw", wrappedData, wrappingKey, { name: "AES-KW" }, { name: "HMAC", hash: "SHA-256" }, true, ["sign"]);
    return new Uint8Array(await webCrypto$8.exportKey("raw", unwrapped));
  } catch (err2) {
    if (err2.name === "OperationError") {
      throw new Error("Key Data Integrity failed");
    }
    throw err2;
  }
}
var webCrypto$7 = util.getWebCrypto();
async function computeHKDF(hashAlgo, inputKey, salt, info, outLen) {
  const hash2 = enums.read(enums.webHash, hashAlgo);
  if (!hash2) throw new Error("Hash algo not supported with HKDF");
  const importedKey = await webCrypto$7.importKey("raw", inputKey, "HKDF", false, ["deriveBits"]);
  const bits2 = await webCrypto$7.deriveBits({ name: "HKDF", hash: hash2, salt, info }, importedKey, outLen * 8);
  return new Uint8Array(bits2);
}
var HKDF_INFO = {
  x25519: util.encodeUTF8("OpenPGP X25519"),
  x448: util.encodeUTF8("OpenPGP X448")
};
async function generate$2(algo) {
  switch (algo) {
    case enums.publicKey.x25519: {
      const k = getRandomBytes(32);
      const { publicKey: A2 } = nacl.box.keyPair.fromSecretKey(k);
      return { A: A2, k };
    }
    case enums.publicKey.x448: {
      const x4482 = await util.getNobleCurve(enums.publicKey.x448);
      const k = x4482.utils.randomPrivateKey();
      const A2 = x4482.getPublicKey(k);
      return { A: A2, k };
    }
    default:
      throw new Error("Unsupported ECDH algorithm");
  }
}
async function validateParams$6(algo, A2, k) {
  switch (algo) {
    case enums.publicKey.x25519: {
      const { publicKey } = nacl.box.keyPair.fromSecretKey(k);
      return util.equalsUint8Array(A2, publicKey);
    }
    case enums.publicKey.x448: {
      const x4482 = await util.getNobleCurve(enums.publicKey.x448);
      const publicKey = x4482.getPublicKey(k);
      return util.equalsUint8Array(A2, publicKey);
    }
    default:
      return false;
  }
}
async function encrypt$3(algo, data, recipientA) {
  const { ephemeralPublicKey, sharedSecret } = await generateEphemeralEncryptionMaterial(algo, recipientA);
  const hkdfInput = util.concatUint8Array([
    ephemeralPublicKey,
    recipientA,
    sharedSecret
  ]);
  switch (algo) {
    case enums.publicKey.x25519: {
      const cipherAlgo = enums.symmetric.aes128;
      const { keySize } = getCipherParams(cipherAlgo);
      const encryptionKey = await computeHKDF(enums.hash.sha256, hkdfInput, new Uint8Array(), HKDF_INFO.x25519, keySize);
      const wrappedKey = await wrap(cipherAlgo, encryptionKey, data);
      return { ephemeralPublicKey, wrappedKey };
    }
    case enums.publicKey.x448: {
      const cipherAlgo = enums.symmetric.aes256;
      const { keySize } = getCipherParams(enums.symmetric.aes256);
      const encryptionKey = await computeHKDF(enums.hash.sha512, hkdfInput, new Uint8Array(), HKDF_INFO.x448, keySize);
      const wrappedKey = await wrap(cipherAlgo, encryptionKey, data);
      return { ephemeralPublicKey, wrappedKey };
    }
    default:
      throw new Error("Unsupported ECDH algorithm");
  }
}
async function decrypt$3(algo, ephemeralPublicKey, wrappedKey, A2, k) {
  const sharedSecret = await recomputeSharedSecret(algo, ephemeralPublicKey, A2, k);
  const hkdfInput = util.concatUint8Array([
    ephemeralPublicKey,
    A2,
    sharedSecret
  ]);
  switch (algo) {
    case enums.publicKey.x25519: {
      const cipherAlgo = enums.symmetric.aes128;
      const { keySize } = getCipherParams(cipherAlgo);
      const encryptionKey = await computeHKDF(enums.hash.sha256, hkdfInput, new Uint8Array(), HKDF_INFO.x25519, keySize);
      return unwrap(cipherAlgo, encryptionKey, wrappedKey);
    }
    case enums.publicKey.x448: {
      const cipherAlgo = enums.symmetric.aes256;
      const { keySize } = getCipherParams(enums.symmetric.aes256);
      const encryptionKey = await computeHKDF(enums.hash.sha512, hkdfInput, new Uint8Array(), HKDF_INFO.x448, keySize);
      return unwrap(cipherAlgo, encryptionKey, wrappedKey);
    }
    default:
      throw new Error("Unsupported ECDH algorithm");
  }
}
function getPayloadSize(algo) {
  switch (algo) {
    case enums.publicKey.x25519:
      return 32;
    case enums.publicKey.x448:
      return 56;
    default:
      throw new Error("Unsupported ECDH algorithm");
  }
}
async function generateEphemeralEncryptionMaterial(algo, recipientA) {
  switch (algo) {
    case enums.publicKey.x25519: {
      const ephemeralSecretKey = getRandomBytes(getPayloadSize(algo));
      const sharedSecret = nacl.scalarMult(ephemeralSecretKey, recipientA);
      assertNonZeroArray(sharedSecret);
      const { publicKey: ephemeralPublicKey } = nacl.box.keyPair.fromSecretKey(ephemeralSecretKey);
      return { ephemeralPublicKey, sharedSecret };
    }
    case enums.publicKey.x448: {
      const x4482 = await util.getNobleCurve(enums.publicKey.x448);
      const ephemeralSecretKey = x4482.utils.randomPrivateKey();
      const sharedSecret = x4482.getSharedSecret(ephemeralSecretKey, recipientA);
      assertNonZeroArray(sharedSecret);
      const ephemeralPublicKey = x4482.getPublicKey(ephemeralSecretKey);
      return { ephemeralPublicKey, sharedSecret };
    }
    default:
      throw new Error("Unsupported ECDH algorithm");
  }
}
async function recomputeSharedSecret(algo, ephemeralPublicKey, A2, k) {
  switch (algo) {
    case enums.publicKey.x25519: {
      const sharedSecret = nacl.scalarMult(k, ephemeralPublicKey);
      assertNonZeroArray(sharedSecret);
      return sharedSecret;
    }
    case enums.publicKey.x448: {
      const x4482 = await util.getNobleCurve(enums.publicKey.x448);
      const sharedSecret = x4482.getSharedSecret(k, ephemeralPublicKey);
      assertNonZeroArray(sharedSecret);
      return sharedSecret;
    }
    default:
      throw new Error("Unsupported ECDH algorithm");
  }
}
function assertNonZeroArray(sharedSecret) {
  let acc = 0;
  for (let i = 0; i < sharedSecret.length; i++) {
    acc |= sharedSecret[i];
  }
  if (acc === 0) {
    throw new Error("Unexpected low order point");
  }
}
var ecdh_x = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  decrypt: decrypt$3,
  encrypt: encrypt$3,
  generate: generate$2,
  generateEphemeralEncryptionMaterial,
  getPayloadSize,
  recomputeSharedSecret,
  validateParams: validateParams$6
});
var webCrypto$6 = util.getWebCrypto();
var nodeCrypto$6 = util.getNodeCrypto();
var webCurves = {
  [enums.curve.nistP256]: "P-256",
  [enums.curve.nistP384]: "P-384",
  [enums.curve.nistP521]: "P-521"
};
var knownCurves = nodeCrypto$6 ? nodeCrypto$6.getCurves() : [];
var nodeCurves = nodeCrypto$6 ? {
  [enums.curve.secp256k1]: knownCurves.includes("secp256k1") ? "secp256k1" : void 0,
  [enums.curve.nistP256]: knownCurves.includes("prime256v1") ? "prime256v1" : void 0,
  [enums.curve.nistP384]: knownCurves.includes("secp384r1") ? "secp384r1" : void 0,
  [enums.curve.nistP521]: knownCurves.includes("secp521r1") ? "secp521r1" : void 0,
  [enums.curve.ed25519Legacy]: knownCurves.includes("ED25519") ? "ED25519" : void 0,
  [enums.curve.curve25519Legacy]: knownCurves.includes("X25519") ? "X25519" : void 0,
  [enums.curve.brainpoolP256r1]: knownCurves.includes("brainpoolP256r1") ? "brainpoolP256r1" : void 0,
  [enums.curve.brainpoolP384r1]: knownCurves.includes("brainpoolP384r1") ? "brainpoolP384r1" : void 0,
  [enums.curve.brainpoolP512r1]: knownCurves.includes("brainpoolP512r1") ? "brainpoolP512r1" : void 0
} : {};
var curves = {
  [enums.curve.nistP256]: {
    oid: [6, 8, 42, 134, 72, 206, 61, 3, 1, 7],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha256,
    cipher: enums.symmetric.aes128,
    node: nodeCurves[enums.curve.nistP256],
    web: webCurves[enums.curve.nistP256],
    payloadSize: 32,
    sharedSize: 256,
    wireFormatLeadingByte: 4
  },
  [enums.curve.nistP384]: {
    oid: [6, 5, 43, 129, 4, 0, 34],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha384,
    cipher: enums.symmetric.aes192,
    node: nodeCurves[enums.curve.nistP384],
    web: webCurves[enums.curve.nistP384],
    payloadSize: 48,
    sharedSize: 384,
    wireFormatLeadingByte: 4
  },
  [enums.curve.nistP521]: {
    oid: [6, 5, 43, 129, 4, 0, 35],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha512,
    cipher: enums.symmetric.aes256,
    node: nodeCurves[enums.curve.nistP521],
    web: webCurves[enums.curve.nistP521],
    payloadSize: 66,
    sharedSize: 528,
    wireFormatLeadingByte: 4
  },
  [enums.curve.secp256k1]: {
    oid: [6, 5, 43, 129, 4, 0, 10],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha256,
    cipher: enums.symmetric.aes128,
    node: nodeCurves[enums.curve.secp256k1],
    payloadSize: 32,
    wireFormatLeadingByte: 4
  },
  [enums.curve.ed25519Legacy]: {
    oid: [6, 9, 43, 6, 1, 4, 1, 218, 71, 15, 1],
    keyType: enums.publicKey.eddsaLegacy,
    hash: enums.hash.sha512,
    node: false,
    // nodeCurves.ed25519 TODO
    payloadSize: 32,
    wireFormatLeadingByte: 64
  },
  [enums.curve.curve25519Legacy]: {
    oid: [6, 10, 43, 6, 1, 4, 1, 151, 85, 1, 5, 1],
    keyType: enums.publicKey.ecdh,
    hash: enums.hash.sha256,
    cipher: enums.symmetric.aes128,
    node: false,
    // nodeCurves.curve25519 TODO
    payloadSize: 32,
    wireFormatLeadingByte: 64
  },
  [enums.curve.brainpoolP256r1]: {
    oid: [6, 9, 43, 36, 3, 3, 2, 8, 1, 1, 7],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha256,
    cipher: enums.symmetric.aes128,
    node: nodeCurves[enums.curve.brainpoolP256r1],
    payloadSize: 32,
    wireFormatLeadingByte: 4
  },
  [enums.curve.brainpoolP384r1]: {
    oid: [6, 9, 43, 36, 3, 3, 2, 8, 1, 1, 11],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha384,
    cipher: enums.symmetric.aes192,
    node: nodeCurves[enums.curve.brainpoolP384r1],
    payloadSize: 48,
    wireFormatLeadingByte: 4
  },
  [enums.curve.brainpoolP512r1]: {
    oid: [6, 9, 43, 36, 3, 3, 2, 8, 1, 1, 13],
    keyType: enums.publicKey.ecdsa,
    hash: enums.hash.sha512,
    cipher: enums.symmetric.aes256,
    node: nodeCurves[enums.curve.brainpoolP512r1],
    payloadSize: 64,
    wireFormatLeadingByte: 4
  }
};
var CurveWithOID = class {
  constructor(oidOrName) {
    try {
      this.name = oidOrName instanceof OID ? oidOrName.getName() : enums.write(enums.curve, oidOrName);
    } catch (err2) {
      throw new UnsupportedError("Unknown curve");
    }
    const params = curves[this.name];
    this.keyType = params.keyType;
    this.oid = params.oid;
    this.hash = params.hash;
    this.cipher = params.cipher;
    this.node = params.node;
    this.web = params.web;
    this.payloadSize = params.payloadSize;
    this.sharedSize = params.sharedSize;
    this.wireFormatLeadingByte = params.wireFormatLeadingByte;
    if (this.web && util.getWebCrypto()) {
      this.type = "web";
    } else if (this.node && util.getNodeCrypto()) {
      this.type = "node";
    } else if (this.name === enums.curve.curve25519Legacy) {
      this.type = "curve25519Legacy";
    } else if (this.name === enums.curve.ed25519Legacy) {
      this.type = "ed25519Legacy";
    }
  }
  async genKeyPair() {
    switch (this.type) {
      case "web":
        try {
          return await webGenKeyPair(this.name, this.wireFormatLeadingByte);
        } catch (err2) {
          util.printDebugError("Browser did not support generating ec key " + err2.message);
          return jsGenKeyPair(this.name);
        }
      case "node":
        return nodeGenKeyPair(this.name);
      case "curve25519Legacy": {
        const { k, A: A2 } = await generate$2(enums.publicKey.x25519);
        const privateKey = k.slice().reverse();
        privateKey[0] = privateKey[0] & 127 | 64;
        privateKey[31] &= 248;
        const publicKey = util.concatUint8Array([new Uint8Array([this.wireFormatLeadingByte]), A2]);
        return { publicKey, privateKey };
      }
      case "ed25519Legacy": {
        const { seed: privateKey, A: A2 } = await generate$3(enums.publicKey.ed25519);
        const publicKey = util.concatUint8Array([new Uint8Array([this.wireFormatLeadingByte]), A2]);
        return { publicKey, privateKey };
      }
      default:
        return jsGenKeyPair(this.name);
    }
  }
};
async function generate$1(curveName) {
  const curve = new CurveWithOID(curveName);
  const { oid, hash: hash2, cipher } = curve;
  const keyPair = await curve.genKeyPair();
  return {
    oid,
    Q: keyPair.publicKey,
    secret: util.leftPad(keyPair.privateKey, curve.payloadSize),
    hash: hash2,
    cipher
  };
}
function getPreferredHashAlgo$1(oid) {
  return curves[oid.getName()].hash;
}
async function validateStandardParams(algo, oid, Q, d) {
  const supportedCurves = {
    [enums.curve.nistP256]: true,
    [enums.curve.nistP384]: true,
    [enums.curve.nistP521]: true,
    [enums.curve.secp256k1]: true,
    [enums.curve.curve25519Legacy]: algo === enums.publicKey.ecdh,
    [enums.curve.brainpoolP256r1]: true,
    [enums.curve.brainpoolP384r1]: true,
    [enums.curve.brainpoolP512r1]: true
  };
  const curveName = oid.getName();
  if (!supportedCurves[curveName]) {
    return false;
  }
  if (curveName === enums.curve.curve25519Legacy) {
    d = d.slice().reverse();
    const { publicKey } = nacl.box.keyPair.fromSecretKey(d);
    Q = new Uint8Array(Q);
    const dG2 = new Uint8Array([64, ...publicKey]);
    if (!util.equalsUint8Array(dG2, Q)) {
      return false;
    }
    return true;
  }
  const nobleCurve = await util.getNobleCurve(enums.publicKey.ecdsa, curveName);
  const dG = nobleCurve.getPublicKey(d, false);
  if (!util.equalsUint8Array(dG, Q)) {
    return false;
  }
  return true;
}
function checkPublicPointEnconding(curve, V) {
  const { payloadSize, wireFormatLeadingByte, name: curveName } = curve;
  const pointSize = curveName === enums.curve.curve25519Legacy || curveName === enums.curve.ed25519Legacy ? payloadSize : payloadSize * 2;
  if (V[0] !== wireFormatLeadingByte || V.length !== pointSize + 1) {
    throw new Error("Invalid point encoding");
  }
}
async function jsGenKeyPair(name2) {
  const nobleCurve = await util.getNobleCurve(enums.publicKey.ecdsa, name2);
  const privateKey = nobleCurve.utils.randomPrivateKey();
  const publicKey = nobleCurve.getPublicKey(privateKey, false);
  return { publicKey, privateKey };
}
async function webGenKeyPair(name2, wireFormatLeadingByte) {
  const webCryptoKey = await webCrypto$6.generateKey({ name: "ECDSA", namedCurve: webCurves[name2] }, true, ["sign", "verify"]);
  const privateKey = await webCrypto$6.exportKey("jwk", webCryptoKey.privateKey);
  const publicKey = await webCrypto$6.exportKey("jwk", webCryptoKey.publicKey);
  return {
    publicKey: jwkToRawPublic(publicKey, wireFormatLeadingByte),
    privateKey: b64ToUint8Array(privateKey.d)
  };
}
async function nodeGenKeyPair(name2) {
  const ecdh2 = nodeCrypto$6.createECDH(nodeCurves[name2]);
  await ecdh2.generateKeys();
  return {
    publicKey: new Uint8Array(ecdh2.getPublicKey()),
    privateKey: new Uint8Array(ecdh2.getPrivateKey())
  };
}
function jwkToRawPublic(jwk, wireFormatLeadingByte) {
  const bufX = b64ToUint8Array(jwk.x);
  const bufY = b64ToUint8Array(jwk.y);
  const publicKey = new Uint8Array(bufX.length + bufY.length + 1);
  publicKey[0] = wireFormatLeadingByte;
  publicKey.set(bufX, 1);
  publicKey.set(bufY, bufX.length + 1);
  return publicKey;
}
function rawPublicToJWK(payloadSize, name2, publicKey) {
  const len = payloadSize;
  const bufX = publicKey.slice(1, len + 1);
  const bufY = publicKey.slice(len + 1, len * 2 + 1);
  const jwk = {
    kty: "EC",
    crv: name2,
    x: uint8ArrayToB64(bufX),
    y: uint8ArrayToB64(bufY),
    ext: true
  };
  return jwk;
}
function privateToJWK(payloadSize, name2, publicKey, privateKey) {
  const jwk = rawPublicToJWK(payloadSize, name2, publicKey);
  jwk.d = uint8ArrayToB64(privateKey);
  return jwk;
}
var webCrypto$5 = util.getWebCrypto();
var nodeCrypto$5 = util.getNodeCrypto();
async function sign$4(oid, hashAlgo, message, publicKey, privateKey, hashed) {
  const curve = new CurveWithOID(oid);
  checkPublicPointEnconding(curve, publicKey);
  if (message && !util.isStream(message)) {
    const keyPair = { publicKey, privateKey };
    switch (curve.type) {
      case "web":
        try {
          return await webSign(curve, hashAlgo, message, keyPair);
        } catch (err2) {
          if (curve.name !== "nistP521" && (err2.name === "DataError" || err2.name === "OperationError")) {
            throw err2;
          }
          util.printDebugError("Browser did not support signing: " + err2.message);
        }
        break;
      case "node":
        return nodeSign(curve, hashAlgo, message, privateKey);
    }
  }
  const nobleCurve = await util.getNobleCurve(enums.publicKey.ecdsa, curve.name);
  const signature = nobleCurve.sign(hashed, privateKey, { lowS: false });
  return {
    r: bigIntToUint8Array(signature.r, "be", curve.payloadSize),
    s: bigIntToUint8Array(signature.s, "be", curve.payloadSize)
  };
}
async function verify$4(oid, hashAlgo, signature, message, publicKey, hashed) {
  const curve = new CurveWithOID(oid);
  checkPublicPointEnconding(curve, publicKey);
  const tryFallbackVerificationForOldBug = async () => hashed[0] === 0 ? jsVerify(curve, signature, hashed.subarray(1), publicKey) : false;
  if (message && !util.isStream(message)) {
    switch (curve.type) {
      case "web":
        try {
          const verified3 = await webVerify(curve, hashAlgo, signature, message, publicKey);
          return verified3 || tryFallbackVerificationForOldBug();
        } catch (err2) {
          if (curve.name !== "nistP521" && (err2.name === "DataError" || err2.name === "OperationError")) {
            throw err2;
          }
          util.printDebugError("Browser did not support verifying: " + err2.message);
        }
        break;
      case "node": {
        const verified3 = await nodeVerify(curve, hashAlgo, signature, message, publicKey);
        return verified3 || tryFallbackVerificationForOldBug();
      }
    }
  }
  const verified2 = await jsVerify(curve, signature, hashed, publicKey);
  return verified2 || tryFallbackVerificationForOldBug();
}
async function validateParams$5(oid, Q, d) {
  const curve = new CurveWithOID(oid);
  if (curve.keyType !== enums.publicKey.ecdsa) {
    return false;
  }
  switch (curve.type) {
    case "web":
    case "node": {
      const message = getRandomBytes(8);
      const hashAlgo = enums.hash.sha256;
      const hashed = await computeDigest(hashAlgo, message);
      try {
        const signature = await sign$4(oid, hashAlgo, message, Q, d, hashed);
        return await verify$4(oid, hashAlgo, signature, message, Q, hashed);
      } catch (err2) {
        return false;
      }
    }
    default:
      return validateStandardParams(enums.publicKey.ecdsa, oid, Q, d);
  }
}
async function jsVerify(curve, signature, hashed, publicKey) {
  const nobleCurve = await util.getNobleCurve(enums.publicKey.ecdsa, curve.name);
  return nobleCurve.verify(util.concatUint8Array([signature.r, signature.s]), hashed, publicKey, { lowS: false });
}
async function webSign(curve, hashAlgo, message, keyPair) {
  const len = curve.payloadSize;
  const jwk = privateToJWK(curve.payloadSize, webCurves[curve.name], keyPair.publicKey, keyPair.privateKey);
  const key = await webCrypto$5.importKey(
    "jwk",
    jwk,
    {
      "name": "ECDSA",
      "namedCurve": webCurves[curve.name],
      "hash": { name: enums.read(enums.webHash, curve.hash) }
    },
    false,
    ["sign"]
  );
  const signature = new Uint8Array(await webCrypto$5.sign(
    {
      "name": "ECDSA",
      "namedCurve": webCurves[curve.name],
      "hash": { name: enums.read(enums.webHash, hashAlgo) }
    },
    key,
    message
  ));
  return {
    r: signature.slice(0, len),
    s: signature.slice(len, len << 1)
  };
}
async function webVerify(curve, hashAlgo, { r, s }, message, publicKey) {
  const jwk = rawPublicToJWK(curve.payloadSize, webCurves[curve.name], publicKey);
  const key = await webCrypto$5.importKey(
    "jwk",
    jwk,
    {
      "name": "ECDSA",
      "namedCurve": webCurves[curve.name],
      "hash": { name: enums.read(enums.webHash, curve.hash) }
    },
    false,
    ["verify"]
  );
  const signature = util.concatUint8Array([r, s]).buffer;
  return webCrypto$5.verify(
    {
      "name": "ECDSA",
      "namedCurve": webCurves[curve.name],
      "hash": { name: enums.read(enums.webHash, hashAlgo) }
    },
    key,
    signature,
    message
  );
}
async function nodeSign(curve, hashAlgo, message, privateKey) {
  const ecKeyUtils = util.nodeRequire("eckey-utils");
  const nodeBuffer = util.getNodeBuffer();
  const { privateKey: derPrivateKey } = ecKeyUtils.generateDer({
    curveName: nodeCurves[curve.name],
    privateKey: nodeBuffer.from(privateKey)
  });
  const sign = nodeCrypto$5.createSign(enums.read(enums.hash, hashAlgo));
  sign.write(message);
  sign.end();
  const signature = new Uint8Array(sign.sign({ key: derPrivateKey, format: "der", type: "sec1", dsaEncoding: "ieee-p1363" }));
  const len = curve.payloadSize;
  return {
    r: signature.subarray(0, len),
    s: signature.subarray(len, len << 1)
  };
}
async function nodeVerify(curve, hashAlgo, { r, s }, message, publicKey) {
  const ecKeyUtils = util.nodeRequire("eckey-utils");
  const nodeBuffer = util.getNodeBuffer();
  const { publicKey: derPublicKey } = ecKeyUtils.generateDer({
    curveName: nodeCurves[curve.name],
    publicKey: nodeBuffer.from(publicKey)
  });
  const verify2 = nodeCrypto$5.createVerify(enums.read(enums.hash, hashAlgo));
  verify2.write(message);
  verify2.end();
  const signature = util.concatUint8Array([r, s]);
  try {
    return verify2.verify({ key: derPublicKey, format: "der", type: "spki", dsaEncoding: "ieee-p1363" }, signature);
  } catch (err2) {
    return false;
  }
}
var ecdsa = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  sign: sign$4,
  validateParams: validateParams$5,
  verify: verify$4
});
async function sign$3(oid, hashAlgo, message, publicKey, privateKey, hashed) {
  const curve = new CurveWithOID(oid);
  checkPublicPointEnconding(curve, publicKey);
  if (getHashByteLength(hashAlgo) < getHashByteLength(enums.hash.sha256)) {
    throw new Error("Hash algorithm too weak for EdDSA.");
  }
  const { RS: signature } = await sign$5(enums.publicKey.ed25519, hashAlgo, message, publicKey.subarray(1), privateKey, hashed);
  return {
    r: signature.subarray(0, 32),
    s: signature.subarray(32)
  };
}
async function verify$3(oid, hashAlgo, { r, s }, m, publicKey, hashed) {
  const curve = new CurveWithOID(oid);
  checkPublicPointEnconding(curve, publicKey);
  if (getHashByteLength(hashAlgo) < getHashByteLength(enums.hash.sha256)) {
    throw new Error("Hash algorithm too weak for EdDSA.");
  }
  const RS = util.concatUint8Array([r, s]);
  return verify$5(enums.publicKey.ed25519, hashAlgo, { RS }, m, publicKey.subarray(1), hashed);
}
async function validateParams$4(oid, Q, k) {
  if (oid.getName() !== enums.curve.ed25519Legacy) {
    return false;
  }
  const { publicKey } = nacl.sign.keyPair.fromSeed(k);
  const dG = new Uint8Array([64, ...publicKey]);
  return util.equalsUint8Array(Q, dG);
}
var eddsa_legacy = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  sign: sign$3,
  validateParams: validateParams$4,
  verify: verify$3
});
function encode3(message) {
  const c = 8 - message.length % 8;
  const padded = new Uint8Array(message.length + c).fill(c);
  padded.set(message);
  return padded;
}
function decode$1(message) {
  const len = message.length;
  if (len > 0) {
    const c = message[len - 1];
    if (c >= 1) {
      const provided = message.subarray(len - c);
      const computed = new Uint8Array(c).fill(c);
      if (util.equalsUint8Array(provided, computed)) {
        return message.subarray(0, len - c);
      }
    }
  }
  throw new Error("Invalid padding");
}
var webCrypto$4 = util.getWebCrypto();
var nodeCrypto$4 = util.getNodeCrypto();
async function validateParams$3(oid, Q, d) {
  return validateStandardParams(enums.publicKey.ecdh, oid, Q, d);
}
function buildEcdhParam(public_algo, oid, kdfParams, fingerprint) {
  return util.concatUint8Array([
    oid.write(),
    new Uint8Array([public_algo]),
    kdfParams.write(),
    util.stringToUint8Array("Anonymous Sender    "),
    fingerprint
  ]);
}
async function kdf(hashAlgo, X2, length, param, stripLeading = false, stripTrailing = false) {
  let i;
  if (stripLeading) {
    for (i = 0; i < X2.length && X2[i] === 0; i++) ;
    X2 = X2.subarray(i);
  }
  if (stripTrailing) {
    for (i = X2.length - 1; i >= 0 && X2[i] === 0; i--) ;
    X2 = X2.subarray(0, i + 1);
  }
  const digest = await computeDigest(hashAlgo, util.concatUint8Array([
    new Uint8Array([0, 0, 0, 1]),
    X2,
    param
  ]));
  return digest.subarray(0, length);
}
async function genPublicEphemeralKey(curve, Q) {
  switch (curve.type) {
    case "curve25519Legacy": {
      const { sharedSecret: sharedKey, ephemeralPublicKey } = await generateEphemeralEncryptionMaterial(enums.publicKey.x25519, Q.subarray(1));
      const publicKey = util.concatUint8Array([new Uint8Array([curve.wireFormatLeadingByte]), ephemeralPublicKey]);
      return { publicKey, sharedKey };
    }
    case "web":
      if (curve.web && util.getWebCrypto()) {
        try {
          return await webPublicEphemeralKey(curve, Q);
        } catch (err2) {
          util.printDebugError(err2);
          return jsPublicEphemeralKey(curve, Q);
        }
      }
      break;
    case "node":
      return nodePublicEphemeralKey(curve, Q);
    default:
      return jsPublicEphemeralKey(curve, Q);
  }
}
async function encrypt$2(oid, kdfParams, data, Q, fingerprint) {
  const m = encode3(data);
  const curve = new CurveWithOID(oid);
  checkPublicPointEnconding(curve, Q);
  const { publicKey, sharedKey } = await genPublicEphemeralKey(curve, Q);
  const param = buildEcdhParam(enums.publicKey.ecdh, oid, kdfParams, fingerprint);
  const { keySize } = getCipherParams(kdfParams.cipher);
  const Z2 = await kdf(kdfParams.hash, sharedKey, keySize, param);
  const wrappedKey = await wrap(kdfParams.cipher, Z2, m);
  return { publicKey, wrappedKey };
}
async function genPrivateEphemeralKey(curve, V, Q, d) {
  if (d.length !== curve.payloadSize) {
    const privateKey = new Uint8Array(curve.payloadSize);
    privateKey.set(d, curve.payloadSize - d.length);
    d = privateKey;
  }
  switch (curve.type) {
    case "curve25519Legacy": {
      const secretKey = d.slice().reverse();
      const sharedKey = await recomputeSharedSecret(enums.publicKey.x25519, V.subarray(1), Q.subarray(1), secretKey);
      return { secretKey, sharedKey };
    }
    case "web":
      if (curve.web && util.getWebCrypto()) {
        try {
          return await webPrivateEphemeralKey(curve, V, Q, d);
        } catch (err2) {
          util.printDebugError(err2);
          return jsPrivateEphemeralKey(curve, V, d);
        }
      }
      break;
    case "node":
      return nodePrivateEphemeralKey(curve, V, d);
    default:
      return jsPrivateEphemeralKey(curve, V, d);
  }
}
async function decrypt$2(oid, kdfParams, V, C, Q, d, fingerprint) {
  const curve = new CurveWithOID(oid);
  checkPublicPointEnconding(curve, Q);
  checkPublicPointEnconding(curve, V);
  const { sharedKey } = await genPrivateEphemeralKey(curve, V, Q, d);
  const param = buildEcdhParam(enums.publicKey.ecdh, oid, kdfParams, fingerprint);
  const { keySize } = getCipherParams(kdfParams.cipher);
  let err2;
  for (let i = 0; i < 3; i++) {
    try {
      const Z2 = await kdf(kdfParams.hash, sharedKey, keySize, param, i === 1, i === 2);
      return decode$1(await unwrap(kdfParams.cipher, Z2, C));
    } catch (e) {
      err2 = e;
    }
  }
  throw err2;
}
async function jsPrivateEphemeralKey(curve, V, d) {
  const nobleCurve = await util.getNobleCurve(enums.publicKey.ecdh, curve.name);
  const sharedSecretWithParity = nobleCurve.getSharedSecret(d, V);
  const sharedKey = sharedSecretWithParity.subarray(1);
  return { secretKey: d, sharedKey };
}
async function jsPublicEphemeralKey(curve, Q) {
  const nobleCurve = await util.getNobleCurve(enums.publicKey.ecdh, curve.name);
  const { publicKey: V, privateKey: v } = await curve.genKeyPair();
  const sharedSecretWithParity = nobleCurve.getSharedSecret(v, Q);
  const sharedKey = sharedSecretWithParity.subarray(1);
  return { publicKey: V, sharedKey };
}
async function webPrivateEphemeralKey(curve, V, Q, d) {
  const recipient = privateToJWK(curve.payloadSize, curve.web, Q, d);
  let privateKey = webCrypto$4.importKey(
    "jwk",
    recipient,
    {
      name: "ECDH",
      namedCurve: curve.web
    },
    true,
    ["deriveKey", "deriveBits"]
  );
  const jwk = rawPublicToJWK(curve.payloadSize, curve.web, V);
  let sender = webCrypto$4.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: curve.web
    },
    true,
    []
  );
  [privateKey, sender] = await Promise.all([privateKey, sender]);
  let S2 = webCrypto$4.deriveBits(
    {
      name: "ECDH",
      namedCurve: curve.web,
      public: sender
    },
    privateKey,
    curve.sharedSize
  );
  let secret = webCrypto$4.exportKey(
    "jwk",
    privateKey
  );
  [S2, secret] = await Promise.all([S2, secret]);
  const sharedKey = new Uint8Array(S2);
  const secretKey = b64ToUint8Array(secret.d);
  return { secretKey, sharedKey };
}
async function webPublicEphemeralKey(curve, Q) {
  const jwk = rawPublicToJWK(curve.payloadSize, curve.web, Q);
  let keyPair = webCrypto$4.generateKey(
    {
      name: "ECDH",
      namedCurve: curve.web
    },
    true,
    ["deriveKey", "deriveBits"]
  );
  let recipient = webCrypto$4.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: curve.web
    },
    false,
    []
  );
  [keyPair, recipient] = await Promise.all([keyPair, recipient]);
  let s = webCrypto$4.deriveBits(
    {
      name: "ECDH",
      namedCurve: curve.web,
      public: recipient
    },
    keyPair.privateKey,
    curve.sharedSize
  );
  let p = webCrypto$4.exportKey(
    "jwk",
    keyPair.publicKey
  );
  [s, p] = await Promise.all([s, p]);
  const sharedKey = new Uint8Array(s);
  const publicKey = new Uint8Array(jwkToRawPublic(p, curve.wireFormatLeadingByte));
  return { publicKey, sharedKey };
}
async function nodePrivateEphemeralKey(curve, V, d) {
  const recipient = nodeCrypto$4.createECDH(curve.node);
  recipient.setPrivateKey(d);
  const sharedKey = new Uint8Array(recipient.computeSecret(V));
  const secretKey = new Uint8Array(recipient.getPrivateKey());
  return { secretKey, sharedKey };
}
async function nodePublicEphemeralKey(curve, Q) {
  const sender = nodeCrypto$4.createECDH(curve.node);
  sender.generateKeys();
  const sharedKey = new Uint8Array(sender.computeSecret(Q));
  const publicKey = new Uint8Array(sender.getPublicKey());
  return { publicKey, sharedKey };
}
var ecdh = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  decrypt: decrypt$2,
  encrypt: encrypt$2,
  validateParams: validateParams$3
});
var elliptic = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  CurveWithOID,
  ecdh,
  ecdhX: ecdh_x,
  ecdsa,
  eddsa,
  eddsaLegacy: eddsa_legacy,
  generate: generate$1,
  getPreferredHashAlgo: getPreferredHashAlgo$1
});
var _0n$7 = BigInt(0);
var _1n$9 = BigInt(1);
async function sign$2(hashAlgo, hashed, g, p, q, x) {
  const _0n2 = BigInt(0);
  p = uint8ArrayToBigInt(p);
  q = uint8ArrayToBigInt(q);
  g = uint8ArrayToBigInt(g);
  x = uint8ArrayToBigInt(x);
  let k;
  let r;
  let s;
  let t;
  g = mod$1(g, p);
  x = mod$1(x, q);
  const h = mod$1(uint8ArrayToBigInt(hashed.subarray(0, byteLength(q))), q);
  while (true) {
    k = getRandomBigInteger(_1n$9, q);
    r = mod$1(modExp(g, k, p), q);
    if (r === _0n2) {
      continue;
    }
    const xr = mod$1(x * r, q);
    t = mod$1(h + xr, q);
    s = mod$1(modInv(k, q) * t, q);
    if (s === _0n2) {
      continue;
    }
    break;
  }
  return {
    r: bigIntToUint8Array(r, "be", byteLength(p)),
    s: bigIntToUint8Array(s, "be", byteLength(p))
  };
}
async function verify$2(hashAlgo, r, s, hashed, g, p, q, y) {
  r = uint8ArrayToBigInt(r);
  s = uint8ArrayToBigInt(s);
  p = uint8ArrayToBigInt(p);
  q = uint8ArrayToBigInt(q);
  g = uint8ArrayToBigInt(g);
  y = uint8ArrayToBigInt(y);
  if (r <= _0n$7 || r >= q || s <= _0n$7 || s >= q) {
    util.printDebug("invalid DSA Signature");
    return false;
  }
  const h = mod$1(uint8ArrayToBigInt(hashed.subarray(0, byteLength(q))), q);
  const w = modInv(s, q);
  if (w === _0n$7) {
    util.printDebug("invalid DSA Signature");
    return false;
  }
  g = mod$1(g, p);
  y = mod$1(y, p);
  const u1 = mod$1(h * w, q);
  const u2 = mod$1(r * w, q);
  const t1 = modExp(g, u1, p);
  const t2 = modExp(y, u2, p);
  const v = mod$1(mod$1(t1 * t2, p), q);
  return v === r;
}
async function validateParams$2(p, q, g, y, x) {
  p = uint8ArrayToBigInt(p);
  q = uint8ArrayToBigInt(q);
  g = uint8ArrayToBigInt(g);
  y = uint8ArrayToBigInt(y);
  if (g <= _1n$9 || g >= p) {
    return false;
  }
  if (mod$1(p - _1n$9, q) !== _0n$7) {
    return false;
  }
  if (modExp(g, q, p) !== _1n$9) {
    return false;
  }
  const qSize = BigInt(bitLength(q));
  const _150n = BigInt(150);
  if (qSize < _150n || !isProbablePrime(q, null, 32)) {
    return false;
  }
  x = uint8ArrayToBigInt(x);
  const _2n2 = BigInt(2);
  const r = getRandomBigInteger(_2n2 << qSize - _1n$9, _2n2 << qSize);
  const rqx = q * r + x;
  if (y !== modExp(g, rqx, p)) {
    return false;
  }
  return true;
}
var ECDHSymmetricKey = class {
  constructor(data) {
    if (data) {
      this.data = data;
    }
  }
  /**
   * Read an ECDHSymmetricKey from an Uint8Array:
   * - 1 octect for the length `l`
   * - `l` octects of encoded session key data
   * @param {Uint8Array} bytes
   * @returns {Number} Number of read bytes.
   */
  read(bytes2) {
    if (bytes2.length >= 1) {
      const length = bytes2[0];
      if (bytes2.length >= 1 + length) {
        this.data = bytes2.subarray(1, 1 + length);
        return 1 + this.data.length;
      }
    }
    throw new Error("Invalid symmetric key");
  }
  /**
   * Write an ECDHSymmetricKey as an Uint8Array
   * @returns  {Uint8Array} Serialised data
   */
  write() {
    return util.concatUint8Array([new Uint8Array([this.data.length]), this.data]);
  }
};
var KDFParams = class {
  /**
   * @param {enums.hash} hash - Hash algorithm
   * @param {enums.symmetric} cipher - Symmetric algorithm
   */
  constructor(data) {
    if (data) {
      const { hash: hash2, cipher } = data;
      this.hash = hash2;
      this.cipher = cipher;
    } else {
      this.hash = null;
      this.cipher = null;
    }
  }
  /**
   * Read KDFParams from an Uint8Array
   * @param {Uint8Array} input - Where to read the KDFParams from
   * @returns {Number} Number of read bytes.
   */
  read(input) {
    if (input.length < 4 || input[0] !== 3 || input[1] !== 1) {
      throw new UnsupportedError("Cannot read KDFParams");
    }
    this.hash = input[2];
    this.cipher = input[3];
    return 4;
  }
  /**
   * Write KDFParams to an Uint8Array
   * @returns  {Uint8Array}  Array with the KDFParams value
   */
  write() {
    return new Uint8Array([3, 1, this.hash, this.cipher]);
  }
};
var ECDHXSymmetricKey = class _ECDHXSymmetricKey {
  static fromObject({ wrappedKey, algorithm }) {
    const instance = new _ECDHXSymmetricKey();
    instance.wrappedKey = wrappedKey;
    instance.algorithm = algorithm;
    return instance;
  }
  /**
   * - 1 octect for the length `l`
   * - `l` octects of encoded session key data (with optional leading algorithm byte)
   * @param {Uint8Array} bytes
   * @returns {Number} Number of read bytes.
   */
  read(bytes2) {
    let read = 0;
    let followLength = bytes2[read++];
    this.algorithm = followLength % 2 ? bytes2[read++] : null;
    followLength -= followLength % 2;
    this.wrappedKey = util.readExactSubarray(bytes2, read, read + followLength);
    read += followLength;
  }
  /**
   * Write an MontgomerySymmetricKey as an Uint8Array
   * @returns  {Uint8Array} Serialised data
   */
  write() {
    return util.concatUint8Array([
      this.algorithm ? new Uint8Array([this.wrappedKey.length + 1, this.algorithm]) : new Uint8Array([this.wrappedKey.length]),
      this.wrappedKey
    ]);
  }
};
async function publicKeyEncrypt(keyAlgo, symmetricAlgo, publicParams, data, fingerprint) {
  switch (keyAlgo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign: {
      const { n, e } = publicParams;
      const c = await encrypt$6(data, n, e);
      return { c };
    }
    case enums.publicKey.elgamal: {
      const { p, g, y } = publicParams;
      return encrypt$5(data, p, g, y);
    }
    case enums.publicKey.ecdh: {
      const { oid, Q, kdfParams } = publicParams;
      const { publicKey: V, wrappedKey: C } = await encrypt$2(
        oid,
        kdfParams,
        data,
        Q,
        fingerprint
      );
      return { V, C: new ECDHSymmetricKey(C) };
    }
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      if (symmetricAlgo && !util.isAES(symmetricAlgo)) {
        throw new Error("X25519 and X448 keys can only encrypt AES session keys");
      }
      const { A: A2 } = publicParams;
      const { ephemeralPublicKey, wrappedKey } = await encrypt$3(
        keyAlgo,
        data,
        A2
      );
      const C = ECDHXSymmetricKey.fromObject({ algorithm: symmetricAlgo, wrappedKey });
      return { ephemeralPublicKey, C };
    }
    default:
      return [];
  }
}
async function publicKeyDecrypt(algo, publicKeyParams, privateKeyParams, sessionKeyParams, fingerprint, randomPayload) {
  switch (algo) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaEncrypt: {
      const { c } = sessionKeyParams;
      const { n, e } = publicKeyParams;
      const { d, p, q, u } = privateKeyParams;
      return decrypt$6(c, n, e, d, p, q, u, randomPayload);
    }
    case enums.publicKey.elgamal: {
      const { c1, c2 } = sessionKeyParams;
      const p = publicKeyParams.p;
      const x = privateKeyParams.x;
      return decrypt$5(c1, c2, p, x, randomPayload);
    }
    case enums.publicKey.ecdh: {
      const { oid, Q, kdfParams } = publicKeyParams;
      const { d } = privateKeyParams;
      const { V, C } = sessionKeyParams;
      return decrypt$2(
        oid,
        kdfParams,
        V,
        C.data,
        Q,
        d,
        fingerprint
      );
    }
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      const { A: A2 } = publicKeyParams;
      const { k } = privateKeyParams;
      const { ephemeralPublicKey, C } = sessionKeyParams;
      if (C.algorithm !== null && !util.isAES(C.algorithm)) {
        throw new Error("AES session key expected");
      }
      return decrypt$3(
        algo,
        ephemeralPublicKey,
        C.wrappedKey,
        A2,
        k
      );
    }
    default:
      throw new Error("Unknown public key encryption algorithm.");
  }
}
function parsePublicKeyParams(algo, bytes2) {
  let read = 0;
  switch (algo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign: {
      const n = util.readMPI(bytes2.subarray(read));
      read += n.length + 2;
      const e = util.readMPI(bytes2.subarray(read));
      read += e.length + 2;
      return { read, publicParams: { n, e } };
    }
    case enums.publicKey.dsa: {
      const p = util.readMPI(bytes2.subarray(read));
      read += p.length + 2;
      const q = util.readMPI(bytes2.subarray(read));
      read += q.length + 2;
      const g = util.readMPI(bytes2.subarray(read));
      read += g.length + 2;
      const y = util.readMPI(bytes2.subarray(read));
      read += y.length + 2;
      return { read, publicParams: { p, q, g, y } };
    }
    case enums.publicKey.elgamal: {
      const p = util.readMPI(bytes2.subarray(read));
      read += p.length + 2;
      const g = util.readMPI(bytes2.subarray(read));
      read += g.length + 2;
      const y = util.readMPI(bytes2.subarray(read));
      read += y.length + 2;
      return { read, publicParams: { p, g, y } };
    }
    case enums.publicKey.ecdsa: {
      const oid = new OID();
      read += oid.read(bytes2);
      checkSupportedCurve(oid);
      const Q = util.readMPI(bytes2.subarray(read));
      read += Q.length + 2;
      return { read, publicParams: { oid, Q } };
    }
    case enums.publicKey.eddsaLegacy: {
      const oid = new OID();
      read += oid.read(bytes2);
      checkSupportedCurve(oid);
      if (oid.getName() !== enums.curve.ed25519Legacy) {
        throw new Error("Unexpected OID for eddsaLegacy");
      }
      let Q = util.readMPI(bytes2.subarray(read));
      read += Q.length + 2;
      Q = util.leftPad(Q, 33);
      return { read, publicParams: { oid, Q } };
    }
    case enums.publicKey.ecdh: {
      const oid = new OID();
      read += oid.read(bytes2);
      checkSupportedCurve(oid);
      const Q = util.readMPI(bytes2.subarray(read));
      read += Q.length + 2;
      const kdfParams = new KDFParams();
      read += kdfParams.read(bytes2.subarray(read));
      return { read, publicParams: { oid, Q, kdfParams } };
    }
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448:
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      const A2 = util.readExactSubarray(bytes2, read, read + getCurvePayloadSize(algo));
      read += A2.length;
      return { read, publicParams: { A: A2 } };
    }
    default:
      throw new UnsupportedError("Unknown public key encryption algorithm.");
  }
}
function parsePrivateKeyParams(algo, bytes2, publicParams) {
  let read = 0;
  switch (algo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign: {
      const d = util.readMPI(bytes2.subarray(read));
      read += d.length + 2;
      const p = util.readMPI(bytes2.subarray(read));
      read += p.length + 2;
      const q = util.readMPI(bytes2.subarray(read));
      read += q.length + 2;
      const u = util.readMPI(bytes2.subarray(read));
      read += u.length + 2;
      return { read, privateParams: { d, p, q, u } };
    }
    case enums.publicKey.dsa:
    case enums.publicKey.elgamal: {
      const x = util.readMPI(bytes2.subarray(read));
      read += x.length + 2;
      return { read, privateParams: { x } };
    }
    case enums.publicKey.ecdsa:
    case enums.publicKey.ecdh: {
      const payloadSize = getCurvePayloadSize(algo, publicParams.oid);
      let d = util.readMPI(bytes2.subarray(read));
      read += d.length + 2;
      d = util.leftPad(d, payloadSize);
      return { read, privateParams: { d } };
    }
    case enums.publicKey.eddsaLegacy: {
      const payloadSize = getCurvePayloadSize(algo, publicParams.oid);
      if (publicParams.oid.getName() !== enums.curve.ed25519Legacy) {
        throw new Error("Unexpected OID for eddsaLegacy");
      }
      let seed = util.readMPI(bytes2.subarray(read));
      read += seed.length + 2;
      seed = util.leftPad(seed, payloadSize);
      return { read, privateParams: { seed } };
    }
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448: {
      const payloadSize = getCurvePayloadSize(algo);
      const seed = util.readExactSubarray(bytes2, read, read + payloadSize);
      read += seed.length;
      return { read, privateParams: { seed } };
    }
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      const payloadSize = getCurvePayloadSize(algo);
      const k = util.readExactSubarray(bytes2, read, read + payloadSize);
      read += k.length;
      return { read, privateParams: { k } };
    }
    default:
      throw new UnsupportedError("Unknown public key encryption algorithm.");
  }
}
function parseEncSessionKeyParams(algo, bytes2) {
  let read = 0;
  switch (algo) {
    //   Algorithm-Specific Fields for RSA encrypted session keys:
    //       - MPI of RSA encrypted value m**e mod n.
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign: {
      const c = util.readMPI(bytes2.subarray(read));
      return { c };
    }
    //   Algorithm-Specific Fields for Elgamal encrypted session keys:
    //       - MPI of Elgamal value g**k mod p
    //       - MPI of Elgamal value m * y**k mod p
    case enums.publicKey.elgamal: {
      const c1 = util.readMPI(bytes2.subarray(read));
      read += c1.length + 2;
      const c2 = util.readMPI(bytes2.subarray(read));
      return { c1, c2 };
    }
    //   Algorithm-Specific Fields for ECDH encrypted session keys:
    //       - MPI containing the ephemeral key used to establish the shared secret
    //       - ECDH Symmetric Key
    case enums.publicKey.ecdh: {
      const V = util.readMPI(bytes2.subarray(read));
      read += V.length + 2;
      const C = new ECDHSymmetricKey();
      C.read(bytes2.subarray(read));
      return { V, C };
    }
    //   Algorithm-Specific Fields for X25519 or X448 encrypted session keys:
    //       - 32 octets representing an ephemeral X25519 public key (or 57 octets for X448).
    //       - A one-octet size of the following fields.
    //       - The one-octet algorithm identifier, if it was passed (in the case of a v3 PKESK packet).
    //       - The encrypted session key.
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      const pointSize = getCurvePayloadSize(algo);
      const ephemeralPublicKey = util.readExactSubarray(bytes2, read, read + pointSize);
      read += ephemeralPublicKey.length;
      const C = new ECDHXSymmetricKey();
      C.read(bytes2.subarray(read));
      return { ephemeralPublicKey, C };
    }
    default:
      throw new UnsupportedError("Unknown public key encryption algorithm.");
  }
}
function serializeParams(algo, params) {
  const algosWithNativeRepresentation = /* @__PURE__ */ new Set([
    enums.publicKey.ed25519,
    enums.publicKey.x25519,
    enums.publicKey.ed448,
    enums.publicKey.x448
  ]);
  const orderedParams = Object.keys(params).map((name2) => {
    const param = params[name2];
    if (!util.isUint8Array(param)) return param.write();
    return algosWithNativeRepresentation.has(algo) ? param : util.uint8ArrayToMPI(param);
  });
  return util.concatUint8Array(orderedParams);
}
function generateParams(algo, bits2, oid) {
  switch (algo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign:
      return generate$4(bits2, 65537).then(({ n, e, d, p, q, u }) => ({
        privateParams: { d, p, q, u },
        publicParams: { n, e }
      }));
    case enums.publicKey.ecdsa:
      return generate$1(oid).then(({ oid: oid2, Q, secret }) => ({
        privateParams: { d: secret },
        publicParams: { oid: new OID(oid2), Q }
      }));
    case enums.publicKey.eddsaLegacy:
      return generate$1(oid).then(({ oid: oid2, Q, secret }) => ({
        privateParams: { seed: secret },
        publicParams: { oid: new OID(oid2), Q }
      }));
    case enums.publicKey.ecdh:
      return generate$1(oid).then(({ oid: oid2, Q, secret, hash: hash2, cipher }) => ({
        privateParams: { d: secret },
        publicParams: {
          oid: new OID(oid2),
          Q,
          kdfParams: new KDFParams({ hash: hash2, cipher })
        }
      }));
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448:
      return generate$3(algo).then(({ A: A2, seed }) => ({
        privateParams: { seed },
        publicParams: { A: A2 }
      }));
    case enums.publicKey.x25519:
    case enums.publicKey.x448:
      return generate$2(algo).then(({ A: A2, k }) => ({
        privateParams: { k },
        publicParams: { A: A2 }
      }));
    case enums.publicKey.dsa:
    case enums.publicKey.elgamal:
      throw new Error("Unsupported algorithm for key generation.");
    default:
      throw new Error("Unknown public key algorithm.");
  }
}
async function validateParams$1(algo, publicParams, privateParams) {
  if (!publicParams || !privateParams) {
    throw new Error("Missing key parameters");
  }
  switch (algo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign: {
      const { n, e } = publicParams;
      const { d, p, q, u } = privateParams;
      return validateParams$9(n, e, d, p, q, u);
    }
    case enums.publicKey.dsa: {
      const { p, q, g, y } = publicParams;
      const { x } = privateParams;
      return validateParams$2(p, q, g, y, x);
    }
    case enums.publicKey.elgamal: {
      const { p, g, y } = publicParams;
      const { x } = privateParams;
      return validateParams$8(p, g, y, x);
    }
    case enums.publicKey.ecdsa:
    case enums.publicKey.ecdh: {
      const algoModule = elliptic[enums.read(enums.publicKey, algo)];
      const { oid, Q } = publicParams;
      const { d } = privateParams;
      return algoModule.validateParams(oid, Q, d);
    }
    case enums.publicKey.eddsaLegacy: {
      const { Q, oid } = publicParams;
      const { seed } = privateParams;
      return validateParams$4(oid, Q, seed);
    }
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448: {
      const { A: A2 } = publicParams;
      const { seed } = privateParams;
      return validateParams$7(algo, A2, seed);
    }
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      const { A: A2 } = publicParams;
      const { k } = privateParams;
      return validateParams$6(algo, A2, k);
    }
    default:
      throw new Error("Unknown public key algorithm.");
  }
}
function generateSessionKey$1(algo) {
  const { keySize } = getCipherParams(algo);
  return getRandomBytes(keySize);
}
function checkSupportedCurve(oid) {
  try {
    oid.getName();
  } catch (e) {
    throw new UnsupportedError("Unknown curve OID");
  }
}
function getCurvePayloadSize(algo, oid) {
  switch (algo) {
    case enums.publicKey.ecdsa:
    case enums.publicKey.ecdh:
    case enums.publicKey.eddsaLegacy:
      return new CurveWithOID(oid).payloadSize;
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448:
      return getPayloadSize$1(algo);
    case enums.publicKey.x25519:
    case enums.publicKey.x448:
      return getPayloadSize(algo);
    default:
      throw new Error("Unknown elliptic algo");
  }
}
function getPreferredCurveHashAlgo(algo, oid) {
  switch (algo) {
    case enums.publicKey.ecdsa:
    case enums.publicKey.eddsaLegacy:
      return getPreferredHashAlgo$1(oid);
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448:
      return getPreferredHashAlgo$2(algo);
    default:
      throw new Error("Unknown elliptic signing algo");
  }
}
var webCrypto$3 = util.getWebCrypto();
var nodeCrypto$3 = util.getNodeCrypto();
var knownAlgos = nodeCrypto$3 ? nodeCrypto$3.getCiphers() : [];
var nodeAlgos = {
  idea: knownAlgos.includes("idea-cfb") ? "idea-cfb" : void 0,
  /* Unused, not implemented */
  tripledes: knownAlgos.includes("des-ede3-cfb") ? "des-ede3-cfb" : void 0,
  cast5: knownAlgos.includes("cast5-cfb") ? "cast5-cfb" : void 0,
  blowfish: knownAlgos.includes("bf-cfb") ? "bf-cfb" : void 0,
  aes128: knownAlgos.includes("aes-128-cfb") ? "aes-128-cfb" : void 0,
  aes192: knownAlgos.includes("aes-192-cfb") ? "aes-192-cfb" : void 0,
  aes256: knownAlgos.includes("aes-256-cfb") ? "aes-256-cfb" : void 0
  /* twofish is not implemented in OpenSSL */
};
async function getPrefixRandom(algo) {
  const { blockSize } = getCipherParams(algo);
  const prefixrandom = await getRandomBytes(blockSize);
  const repeat = new Uint8Array([prefixrandom[prefixrandom.length - 2], prefixrandom[prefixrandom.length - 1]]);
  return util.concat([prefixrandom, repeat]);
}
async function encrypt$1(algo, key, plaintext, iv, config2) {
  const algoName = enums.read(enums.symmetric, algo);
  if (util.getNodeCrypto() && nodeAlgos[algoName]) {
    return nodeEncrypt(algo, key, plaintext, iv);
  }
  if (util.isAES(algo)) {
    return aesEncrypt(algo, key, plaintext, iv);
  }
  const LegacyCipher = await getLegacyCipher(algo);
  const cipherfn = new LegacyCipher(key);
  const block_size = cipherfn.blockSize;
  const blockc = iv.slice();
  let pt = new Uint8Array();
  const process2 = (chunk) => {
    if (chunk) {
      pt = util.concatUint8Array([pt, chunk]);
    }
    const ciphertext = new Uint8Array(pt.length);
    let i;
    let j = 0;
    while (chunk ? pt.length >= block_size : pt.length) {
      const encblock = cipherfn.encrypt(blockc);
      for (i = 0; i < block_size; i++) {
        blockc[i] = pt[i] ^ encblock[i];
        ciphertext[j++] = blockc[i];
      }
      pt = pt.subarray(block_size);
    }
    return ciphertext.subarray(0, j);
  };
  return transform(plaintext, process2, process2);
}
async function decrypt$1(algo, key, ciphertext, iv) {
  const algoName = enums.read(enums.symmetric, algo);
  if (nodeCrypto$3 && nodeAlgos[algoName]) {
    return nodeDecrypt(algo, key, ciphertext, iv);
  }
  if (util.isAES(algo)) {
    return aesDecrypt(algo, key, ciphertext, iv);
  }
  const LegacyCipher = await getLegacyCipher(algo);
  const cipherfn = new LegacyCipher(key);
  const block_size = cipherfn.blockSize;
  let blockp = iv;
  let ct = new Uint8Array();
  const process2 = (chunk) => {
    if (chunk) {
      ct = util.concatUint8Array([ct, chunk]);
    }
    const plaintext = new Uint8Array(ct.length);
    let i;
    let j = 0;
    while (chunk ? ct.length >= block_size : ct.length) {
      const decblock = cipherfn.encrypt(blockp);
      blockp = ct.subarray(0, block_size);
      for (i = 0; i < block_size; i++) {
        plaintext[j++] = blockp[i] ^ decblock[i];
      }
      ct = ct.subarray(block_size);
    }
    return plaintext.subarray(0, j);
  };
  return transform(ciphertext, process2, process2);
}
var WebCryptoEncryptor = class {
  constructor(algo, key, iv) {
    const { blockSize } = getCipherParams(algo);
    this.key = key;
    this.prevBlock = iv;
    this.nextBlock = new Uint8Array(blockSize);
    this.i = 0;
    this.blockSize = blockSize;
    this.zeroBlock = new Uint8Array(this.blockSize);
  }
  static async isSupported(algo) {
    const { keySize } = getCipherParams(algo);
    return webCrypto$3.importKey("raw", new Uint8Array(keySize), "aes-cbc", false, ["encrypt"]).then(() => true, () => false);
  }
  async _runCBC(plaintext, nonZeroIV) {
    const mode = "AES-CBC";
    this.keyRef = this.keyRef || await webCrypto$3.importKey("raw", this.key, mode, false, ["encrypt"]);
    const ciphertext = await webCrypto$3.encrypt(
      { name: mode, iv: nonZeroIV || this.zeroBlock },
      this.keyRef,
      plaintext
    );
    return new Uint8Array(ciphertext).subarray(0, plaintext.length);
  }
  async encryptChunk(value) {
    const missing = this.nextBlock.length - this.i;
    const added = value.subarray(0, missing);
    this.nextBlock.set(added, this.i);
    if (this.i + value.length >= 2 * this.blockSize) {
      const leftover = (value.length - missing) % this.blockSize;
      const plaintext = util.concatUint8Array([
        this.nextBlock,
        value.subarray(missing, value.length - leftover)
      ]);
      const toEncrypt = util.concatUint8Array([
        this.prevBlock,
        plaintext.subarray(0, plaintext.length - this.blockSize)
        // stop one block "early", since we only need to xor the plaintext and pass it over as prevBlock
      ]);
      const encryptedBlocks = await this._runCBC(toEncrypt);
      xorMut$1(encryptedBlocks, plaintext);
      this.prevBlock = encryptedBlocks.slice(-this.blockSize);
      if (leftover > 0) this.nextBlock.set(value.subarray(-leftover));
      this.i = leftover;
      return encryptedBlocks;
    }
    this.i += added.length;
    let encryptedBlock;
    if (this.i === this.nextBlock.length) {
      const curBlock = this.nextBlock;
      encryptedBlock = await this._runCBC(this.prevBlock);
      xorMut$1(encryptedBlock, curBlock);
      this.prevBlock = encryptedBlock.slice();
      this.i = 0;
      const remaining = value.subarray(added.length);
      this.nextBlock.set(remaining, this.i);
      this.i += remaining.length;
    } else {
      encryptedBlock = new Uint8Array();
    }
    return encryptedBlock;
  }
  async finish() {
    let result;
    if (this.i === 0) {
      result = new Uint8Array();
    } else {
      this.nextBlock = this.nextBlock.subarray(0, this.i);
      const curBlock = this.nextBlock;
      const encryptedBlock = await this._runCBC(this.prevBlock);
      xorMut$1(encryptedBlock, curBlock);
      result = encryptedBlock.subarray(0, curBlock.length);
    }
    this.clearSensitiveData();
    return result;
  }
  clearSensitiveData() {
    this.nextBlock.fill(0);
    this.prevBlock.fill(0);
    this.keyRef = null;
    this.key = null;
  }
  async encrypt(plaintext) {
    const encryptedWithPadding = await this._runCBC(
      util.concatUint8Array([new Uint8Array(this.blockSize), plaintext]),
      this.iv
    );
    const ct = encryptedWithPadding.subarray(0, plaintext.length);
    xorMut$1(ct, plaintext);
    this.clearSensitiveData();
    return ct;
  }
};
var NobleStreamProcessor = class {
  constructor(forEncryption, algo, key, iv) {
    this.forEncryption = forEncryption;
    const { blockSize } = getCipherParams(algo);
    this.key = unsafe.expandKeyLE(key);
    if (iv.byteOffset % 4 !== 0) iv = iv.slice();
    this.prevBlock = getUint32Array(iv);
    this.nextBlock = new Uint8Array(blockSize);
    this.i = 0;
    this.blockSize = blockSize;
  }
  _runCFB(src) {
    const src32 = getUint32Array(src);
    const dst = new Uint8Array(src.length);
    const dst32 = getUint32Array(dst);
    for (let i = 0; i + 4 <= dst32.length; i += 4) {
      const { s0: e0, s1: e1, s2: e2, s3: e3 } = unsafe.encrypt(this.key, this.prevBlock[0], this.prevBlock[1], this.prevBlock[2], this.prevBlock[3]);
      dst32[i + 0] = src32[i + 0] ^ e0;
      dst32[i + 1] = src32[i + 1] ^ e1;
      dst32[i + 2] = src32[i + 2] ^ e2;
      dst32[i + 3] = src32[i + 3] ^ e3;
      this.prevBlock = (this.forEncryption ? dst32 : src32).slice(i, i + 4);
    }
    return dst;
  }
  async processChunk(value) {
    const missing = this.nextBlock.length - this.i;
    const added = value.subarray(0, missing);
    this.nextBlock.set(added, this.i);
    if (this.i + value.length >= 2 * this.blockSize) {
      const leftover = (value.length - missing) % this.blockSize;
      const toProcess = util.concatUint8Array([
        this.nextBlock,
        value.subarray(missing, value.length - leftover)
      ]);
      const processedBlocks = this._runCFB(toProcess);
      if (leftover > 0) this.nextBlock.set(value.subarray(-leftover));
      this.i = leftover;
      return processedBlocks;
    }
    this.i += added.length;
    let processedBlock;
    if (this.i === this.nextBlock.length) {
      processedBlock = this._runCFB(this.nextBlock);
      this.i = 0;
      const remaining = value.subarray(added.length);
      this.nextBlock.set(remaining, this.i);
      this.i += remaining.length;
    } else {
      processedBlock = new Uint8Array();
    }
    return processedBlock;
  }
  async finish() {
    let result;
    if (this.i === 0) {
      result = new Uint8Array();
    } else {
      const processedBlock = this._runCFB(this.nextBlock);
      result = processedBlock.subarray(0, this.i);
    }
    this.clearSensitiveData();
    return result;
  }
  clearSensitiveData() {
    this.nextBlock.fill(0);
    this.prevBlock.fill(0);
    this.key.fill(0);
  }
};
async function aesEncrypt(algo, key, pt, iv) {
  if (webCrypto$3 && await WebCryptoEncryptor.isSupported(algo)) {
    const cfb3 = new WebCryptoEncryptor(algo, key, iv);
    return util.isStream(pt) ? transform(pt, (value) => cfb3.encryptChunk(value), () => cfb3.finish()) : cfb3.encrypt(pt);
  } else if (util.isStream(pt)) {
    const cfb3 = new NobleStreamProcessor(true, algo, key, iv);
    return transform(pt, (value) => cfb3.processChunk(value), () => cfb3.finish());
  }
  return cfb(key, iv).encrypt(pt);
}
async function aesDecrypt(algo, key, ct, iv) {
  if (util.isStream(ct)) {
    const cfb3 = new NobleStreamProcessor(false, algo, key, iv);
    return transform(ct, (value) => cfb3.processChunk(value), () => cfb3.finish());
  }
  return cfb(key, iv).decrypt(ct);
}
function xorMut$1(a, b) {
  const aLength = Math.min(a.length, b.length);
  for (let i = 0; i < aLength; i++) {
    a[i] = a[i] ^ b[i];
  }
}
var getUint32Array = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
function nodeEncrypt(algo, key, pt, iv) {
  const algoName = enums.read(enums.symmetric, algo);
  const cipherObj = new nodeCrypto$3.createCipheriv(nodeAlgos[algoName], key, iv);
  return transform(pt, (value) => new Uint8Array(cipherObj.update(value)));
}
function nodeDecrypt(algo, key, ct, iv) {
  const algoName = enums.read(enums.symmetric, algo);
  const decipherObj = new nodeCrypto$3.createDecipheriv(nodeAlgos[algoName], key, iv);
  return transform(ct, (value) => new Uint8Array(decipherObj.update(value)));
}
var webCrypto$2 = util.getWebCrypto();
var nodeCrypto$2 = util.getNodeCrypto();
var blockLength$3 = 16;
function rightXORMut(data, padding) {
  const offset = data.length - blockLength$3;
  for (let i = 0; i < blockLength$3; i++) {
    data[i + offset] ^= padding[i];
  }
  return data;
}
function pad(data, padding, padding2) {
  if (data.length && data.length % blockLength$3 === 0) {
    return rightXORMut(data, padding);
  }
  const padded = new Uint8Array(data.length + (blockLength$3 - data.length % blockLength$3));
  padded.set(data);
  padded[data.length] = 128;
  return rightXORMut(padded, padding2);
}
var zeroBlock$1 = new Uint8Array(blockLength$3);
async function CMAC(key) {
  const cbc3 = await CBC(key);
  const padding = util.double(await cbc3(zeroBlock$1));
  const padding2 = util.double(padding);
  return async function(data) {
    return (await cbc3(pad(data, padding, padding2))).subarray(-blockLength$3);
  };
}
async function CBC(key) {
  if (util.getNodeCrypto()) {
    return async function(pt) {
      const en = new nodeCrypto$2.createCipheriv("aes-" + key.length * 8 + "-cbc", key, zeroBlock$1);
      const ct = en.update(pt);
      return new Uint8Array(ct);
    };
  }
  if (util.getWebCrypto()) {
    try {
      key = await webCrypto$2.importKey("raw", key, { name: "AES-CBC", length: key.length * 8 }, false, ["encrypt"]);
      return async function(pt) {
        const ct = await webCrypto$2.encrypt({ name: "AES-CBC", iv: zeroBlock$1, length: blockLength$3 * 8 }, key, pt);
        return new Uint8Array(ct).subarray(0, ct.byteLength - blockLength$3);
      };
    } catch (err2) {
      if (err2.name !== "NotSupportedError" && !(key.length === 24 && err2.name === "OperationError")) {
        throw err2;
      }
      util.printDebugError("Browser did not support operation: " + err2.message);
    }
  }
  return async function(pt) {
    return cbc(key, zeroBlock$1, { disablePadding: true }).encrypt(pt);
  };
}
var webCrypto$1 = util.getWebCrypto();
var nodeCrypto$1 = util.getNodeCrypto();
var Buffer$2 = util.getNodeBuffer();
var blockLength$2 = 16;
var ivLength$2 = blockLength$2;
var tagLength$2 = blockLength$2;
var zero = new Uint8Array(blockLength$2);
var one$1 = new Uint8Array(blockLength$2);
one$1[blockLength$2 - 1] = 1;
var two = new Uint8Array(blockLength$2);
two[blockLength$2 - 1] = 2;
async function OMAC(key) {
  const cmac = await CMAC(key);
  return function(t, message) {
    return cmac(util.concatUint8Array([t, message]));
  };
}
async function CTR(key) {
  if (util.getNodeCrypto()) {
    return async function(pt, iv) {
      const en = new nodeCrypto$1.createCipheriv("aes-" + key.length * 8 + "-ctr", key, iv);
      const ct = Buffer$2.concat([en.update(pt), en.final()]);
      return new Uint8Array(ct);
    };
  }
  if (util.getWebCrypto()) {
    try {
      const keyRef = await webCrypto$1.importKey("raw", key, { name: "AES-CTR", length: key.length * 8 }, false, ["encrypt"]);
      return async function(pt, iv) {
        const ct = await webCrypto$1.encrypt({ name: "AES-CTR", counter: iv, length: blockLength$2 * 8 }, keyRef, pt);
        return new Uint8Array(ct);
      };
    } catch (err2) {
      if (err2.name !== "NotSupportedError" && !(key.length === 24 && err2.name === "OperationError")) {
        throw err2;
      }
      util.printDebugError("Browser did not support operation: " + err2.message);
    }
  }
  return async function(pt, iv) {
    return ctr(key, iv).encrypt(pt);
  };
}
async function EAX(cipher, key) {
  if (cipher !== enums.symmetric.aes128 && cipher !== enums.symmetric.aes192 && cipher !== enums.symmetric.aes256) {
    throw new Error("EAX mode supports only AES cipher");
  }
  const [
    omac,
    ctr3
  ] = await Promise.all([
    OMAC(key),
    CTR(key)
  ]);
  return {
    /**
     * Encrypt plaintext input.
     * @param {Uint8Array} plaintext - The cleartext input to be encrypted
     * @param {Uint8Array} nonce - The nonce (16 bytes)
     * @param {Uint8Array} adata - Associated data to sign
     * @returns {Promise<Uint8Array>} The ciphertext output.
     */
    encrypt: async function(plaintext, nonce, adata) {
      const [
        omacNonce,
        omacAdata
      ] = await Promise.all([
        omac(zero, nonce),
        omac(one$1, adata)
      ]);
      const ciphered = await ctr3(plaintext, omacNonce);
      const omacCiphered = await omac(two, ciphered);
      const tag = omacCiphered;
      for (let i = 0; i < tagLength$2; i++) {
        tag[i] ^= omacAdata[i] ^ omacNonce[i];
      }
      return util.concatUint8Array([ciphered, tag]);
    },
    /**
     * Decrypt ciphertext input.
     * @param {Uint8Array} ciphertext - The ciphertext input to be decrypted
     * @param {Uint8Array} nonce - The nonce (16 bytes)
     * @param {Uint8Array} adata - Associated data to verify
     * @returns {Promise<Uint8Array>} The plaintext output.
     */
    decrypt: async function(ciphertext, nonce, adata) {
      if (ciphertext.length < tagLength$2) throw new Error("Invalid EAX ciphertext");
      const ciphered = ciphertext.subarray(0, -tagLength$2);
      const ctTag = ciphertext.subarray(-tagLength$2);
      const [
        omacNonce,
        omacAdata,
        omacCiphered
      ] = await Promise.all([
        omac(zero, nonce),
        omac(one$1, adata),
        omac(two, ciphered)
      ]);
      const tag = omacCiphered;
      for (let i = 0; i < tagLength$2; i++) {
        tag[i] ^= omacAdata[i] ^ omacNonce[i];
      }
      if (!util.equalsUint8Array(ctTag, tag)) throw new Error("Authentication tag mismatch");
      const plaintext = await ctr3(ciphered, omacNonce);
      return plaintext;
    }
  };
}
EAX.getNonce = function(iv, chunkIndex) {
  const nonce = iv.slice();
  for (let i = 0; i < chunkIndex.length; i++) {
    nonce[8 + i] ^= chunkIndex[i];
  }
  return nonce;
};
EAX.blockLength = blockLength$2;
EAX.ivLength = ivLength$2;
EAX.tagLength = tagLength$2;
var blockLength$1 = 16;
var ivLength$1 = 15;
var tagLength$1 = 16;
function ntz(n) {
  let ntz2 = 0;
  for (let i = 1; (n & i) === 0; i <<= 1) {
    ntz2++;
  }
  return ntz2;
}
function xorMut(S2, T) {
  for (let i = 0; i < S2.length; i++) {
    S2[i] ^= T[i];
  }
  return S2;
}
function xor(S2, T) {
  return xorMut(S2.slice(), T);
}
var zeroBlock = new Uint8Array(blockLength$1);
var one = new Uint8Array([1]);
async function OCB(cipher, key) {
  const { keySize } = getCipherParams(cipher);
  if (!util.isAES(cipher) || key.length !== keySize) {
    throw new Error("Unexpected algorithm or key size");
  }
  let maxNtz = 0;
  const aes = cbc(key, zeroBlock, { disablePadding: true });
  const encipher = (block) => aes.encrypt(block);
  const decipher = (block) => aes.decrypt(block);
  let mask;
  constructKeyVariables();
  function constructKeyVariables() {
    const mask_x = encipher(zeroBlock);
    const mask_$ = util.double(mask_x);
    mask = [];
    mask[0] = util.double(mask_$);
    mask.x = mask_x;
    mask.$ = mask_$;
  }
  function extendKeyVariables(text, adata) {
    const newMaxNtz = util.nbits(Math.max(text.length, adata.length) / blockLength$1 | 0) - 1;
    for (let i = maxNtz + 1; i <= newMaxNtz; i++) {
      mask[i] = util.double(mask[i - 1]);
    }
    maxNtz = newMaxNtz;
  }
  function hash2(adata) {
    if (!adata.length) {
      return zeroBlock;
    }
    const m = adata.length / blockLength$1 | 0;
    const offset = new Uint8Array(blockLength$1);
    const sum = new Uint8Array(blockLength$1);
    for (let i = 0; i < m; i++) {
      xorMut(offset, mask[ntz(i + 1)]);
      xorMut(sum, encipher(xor(offset, adata)));
      adata = adata.subarray(blockLength$1);
    }
    if (adata.length) {
      xorMut(offset, mask.x);
      const cipherInput = new Uint8Array(blockLength$1);
      cipherInput.set(adata, 0);
      cipherInput[adata.length] = 128;
      xorMut(cipherInput, offset);
      xorMut(sum, encipher(cipherInput));
    }
    return sum;
  }
  function crypt(fn, text, nonce, adata) {
    const m = text.length / blockLength$1 | 0;
    extendKeyVariables(text, adata);
    const paddedNonce = util.concatUint8Array([zeroBlock.subarray(0, ivLength$1 - nonce.length), one, nonce]);
    const bottom = paddedNonce[blockLength$1 - 1] & 63;
    paddedNonce[blockLength$1 - 1] &= 192;
    const kTop = encipher(paddedNonce);
    const stretched = util.concatUint8Array([kTop, xor(kTop.subarray(0, 8), kTop.subarray(1, 9))]);
    const offset = util.shiftRight(stretched.subarray(0 + (bottom >> 3), 17 + (bottom >> 3)), 8 - (bottom & 7)).subarray(1);
    const checksum = new Uint8Array(blockLength$1);
    const ct = new Uint8Array(text.length + tagLength$1);
    let i;
    let pos2 = 0;
    for (i = 0; i < m; i++) {
      xorMut(offset, mask[ntz(i + 1)]);
      ct.set(xorMut(fn(xor(offset, text)), offset), pos2);
      xorMut(checksum, fn === encipher ? text : ct.subarray(pos2));
      text = text.subarray(blockLength$1);
      pos2 += blockLength$1;
    }
    if (text.length) {
      xorMut(offset, mask.x);
      const padding = encipher(offset);
      ct.set(xor(text, padding), pos2);
      const xorInput = new Uint8Array(blockLength$1);
      xorInput.set(fn === encipher ? text : ct.subarray(pos2, -tagLength$1), 0);
      xorInput[text.length] = 128;
      xorMut(checksum, xorInput);
      pos2 += text.length;
    }
    const tag = xorMut(encipher(xorMut(xorMut(checksum, offset), mask.$)), hash2(adata));
    ct.set(tag, pos2);
    return ct;
  }
  return {
    /**
     * Encrypt plaintext input.
     * @param {Uint8Array} plaintext - The cleartext input to be encrypted
     * @param {Uint8Array} nonce - The nonce (15 bytes)
     * @param {Uint8Array} adata - Associated data to sign
     * @returns {Promise<Uint8Array>} The ciphertext output.
     */
    encrypt: async function(plaintext, nonce, adata) {
      return crypt(encipher, plaintext, nonce, adata);
    },
    /**
     * Decrypt ciphertext input.
     * @param {Uint8Array} ciphertext - The ciphertext input to be decrypted
     * @param {Uint8Array} nonce - The nonce (15 bytes)
     * @param {Uint8Array} adata - Associated data to sign
     * @returns {Promise<Uint8Array>} The ciphertext output.
     */
    decrypt: async function(ciphertext, nonce, adata) {
      if (ciphertext.length < tagLength$1) throw new Error("Invalid OCB ciphertext");
      const tag = ciphertext.subarray(-tagLength$1);
      ciphertext = ciphertext.subarray(0, -tagLength$1);
      const crypted = crypt(decipher, ciphertext, nonce, adata);
      if (util.equalsUint8Array(tag, crypted.subarray(-tagLength$1))) {
        return crypted.subarray(0, -tagLength$1);
      }
      throw new Error("Authentication tag mismatch");
    }
  };
}
OCB.getNonce = function(iv, chunkIndex) {
  const nonce = iv.slice();
  for (let i = 0; i < chunkIndex.length; i++) {
    nonce[7 + i] ^= chunkIndex[i];
  }
  return nonce;
};
OCB.blockLength = blockLength$1;
OCB.ivLength = ivLength$1;
OCB.tagLength = tagLength$1;
var webCrypto = util.getWebCrypto();
var nodeCrypto = util.getNodeCrypto();
var Buffer$1 = util.getNodeBuffer();
var blockLength = 16;
var ivLength = 12;
var tagLength = 16;
var ALGO = "AES-GCM";
async function GCM(cipher, key) {
  if (cipher !== enums.symmetric.aes128 && cipher !== enums.symmetric.aes192 && cipher !== enums.symmetric.aes256) {
    throw new Error("GCM mode supports only AES cipher");
  }
  if (util.getNodeCrypto()) {
    return {
      encrypt: async function(pt, iv, adata = new Uint8Array()) {
        const en = new nodeCrypto.createCipheriv("aes-" + key.length * 8 + "-gcm", key, iv);
        en.setAAD(adata);
        const ct = Buffer$1.concat([en.update(pt), en.final(), en.getAuthTag()]);
        return new Uint8Array(ct);
      },
      decrypt: async function(ct, iv, adata = new Uint8Array()) {
        const de = new nodeCrypto.createDecipheriv("aes-" + key.length * 8 + "-gcm", key, iv);
        de.setAAD(adata);
        de.setAuthTag(ct.slice(ct.length - tagLength, ct.length));
        const pt = Buffer$1.concat([de.update(ct.slice(0, ct.length - tagLength)), de.final()]);
        return new Uint8Array(pt);
      }
    };
  }
  if (util.getWebCrypto()) {
    try {
      const _key = await webCrypto.importKey("raw", key, { name: ALGO }, false, ["encrypt", "decrypt"]);
      const webcryptoEmptyMessagesUnsupported = navigator.userAgent.match(/Version\/13\.\d(\.\d)* Safari/) || navigator.userAgent.match(/Version\/(13|14)\.\d(\.\d)* Mobile\/\S* Safari/);
      return {
        encrypt: async function(pt, iv, adata = new Uint8Array()) {
          if (webcryptoEmptyMessagesUnsupported && !pt.length) {
            return gcm(key, iv, adata).encrypt(pt);
          }
          const ct = await webCrypto.encrypt({ name: ALGO, iv, additionalData: adata, tagLength: tagLength * 8 }, _key, pt);
          return new Uint8Array(ct);
        },
        decrypt: async function(ct, iv, adata = new Uint8Array()) {
          if (webcryptoEmptyMessagesUnsupported && ct.length === tagLength) {
            return gcm(key, iv, adata).decrypt(ct);
          }
          try {
            const pt = await webCrypto.decrypt({ name: ALGO, iv, additionalData: adata, tagLength: tagLength * 8 }, _key, ct);
            return new Uint8Array(pt);
          } catch (e) {
            if (e.name === "OperationError") {
              throw new Error("Authentication tag mismatch");
            }
          }
        }
      };
    } catch (err2) {
      if (err2.name !== "NotSupportedError" && !(key.length === 24 && err2.name === "OperationError")) {
        throw err2;
      }
      util.printDebugError("Browser did not support operation: " + err2.message);
    }
  }
  return {
    encrypt: async function(pt, iv, adata) {
      return gcm(key, iv, adata).encrypt(pt);
    },
    decrypt: async function(ct, iv, adata) {
      return gcm(key, iv, adata).decrypt(ct);
    }
  };
}
GCM.getNonce = function(iv, chunkIndex) {
  const nonce = iv.slice();
  for (let i = 0; i < chunkIndex.length; i++) {
    nonce[4 + i] ^= chunkIndex[i];
  }
  return nonce;
};
GCM.blockLength = blockLength;
GCM.ivLength = ivLength;
GCM.tagLength = tagLength;
function getAEADMode(algo, acceptExperimentalGCM = false) {
  switch (algo) {
    case enums.aead.eax:
      return EAX;
    case enums.aead.ocb:
      return OCB;
    case enums.aead.gcm:
      return GCM;
    case enums.aead.experimentalGCM:
      if (!acceptExperimentalGCM) {
        throw new Error("Unexpected non-standard `experimentalGCM` AEAD algorithm provided in `config.preferredAEADAlgorithm`: use `gcm` instead");
      }
      return GCM;
    default:
      throw new Error("Unsupported AEAD mode");
  }
}
function parseSignatureParams(algo, signature) {
  let read = 0;
  switch (algo) {
    // Algorithm-Specific Fields for RSA signatures:
    // -  MPI of RSA signature value m**d mod n.
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaSign: {
      const s = util.readMPI(signature.subarray(read));
      read += s.length + 2;
      return { read, signatureParams: { s } };
    }
    // Algorithm-Specific Fields for DSA or ECDSA signatures:
    // -  MPI of DSA or ECDSA value r.
    // -  MPI of DSA or ECDSA value s.
    case enums.publicKey.dsa:
    case enums.publicKey.ecdsa: {
      const r = util.readMPI(signature.subarray(read));
      read += r.length + 2;
      const s = util.readMPI(signature.subarray(read));
      read += s.length + 2;
      return { read, signatureParams: { r, s } };
    }
    // Algorithm-Specific Fields for legacy EdDSA signatures:
    // -  MPI of an EC point r.
    // -  EdDSA value s, in MPI, in the little endian representation
    case enums.publicKey.eddsaLegacy: {
      const r = util.readMPI(signature.subarray(read));
      read += r.length + 2;
      const s = util.readMPI(signature.subarray(read));
      read += s.length + 2;
      return { read, signatureParams: { r, s } };
    }
    // Algorithm-Specific Fields for Ed25519 signatures:
    // - 64 octets of the native signature
    // Algorithm-Specific Fields for Ed448 signatures:
    // - 114 octets of the native signature
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448: {
      const rsSize = 2 * getPayloadSize$1(algo);
      const RS = util.readExactSubarray(signature, read, read + rsSize);
      read += RS.length;
      return { read, signatureParams: { RS } };
    }
    default:
      throw new UnsupportedError("Unknown signature algorithm.");
  }
}
async function verify$1(algo, hashAlgo, signature, publicParams, data, hashed) {
  switch (algo) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaSign: {
      const { n, e } = publicParams;
      const s = util.leftPad(signature.s, n.length);
      return verify$6(hashAlgo, data, s, n, e, hashed);
    }
    case enums.publicKey.dsa: {
      const { g, p, q, y } = publicParams;
      const { r, s } = signature;
      return verify$2(hashAlgo, r, s, hashed, g, p, q, y);
    }
    case enums.publicKey.ecdsa: {
      const { oid, Q } = publicParams;
      const curveSize = new CurveWithOID(oid).payloadSize;
      const r = util.leftPad(signature.r, curveSize);
      const s = util.leftPad(signature.s, curveSize);
      return verify$4(oid, hashAlgo, { r, s }, data, Q, hashed);
    }
    case enums.publicKey.eddsaLegacy: {
      const { oid, Q } = publicParams;
      const curveSize = new CurveWithOID(oid).payloadSize;
      const r = util.leftPad(signature.r, curveSize);
      const s = util.leftPad(signature.s, curveSize);
      return verify$3(oid, hashAlgo, { r, s }, data, Q, hashed);
    }
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448: {
      const { A: A2 } = publicParams;
      return verify$5(algo, hashAlgo, signature, data, A2, hashed);
    }
    default:
      throw new Error("Unknown signature algorithm.");
  }
}
async function sign$1(algo, hashAlgo, publicKeyParams, privateKeyParams, data, hashed) {
  if (!publicKeyParams || !privateKeyParams) {
    throw new Error("Missing key parameters");
  }
  switch (algo) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaSign: {
      const { n, e } = publicKeyParams;
      const { d, p, q, u } = privateKeyParams;
      const s = await sign$6(hashAlgo, data, n, e, d, p, q, u, hashed);
      return { s };
    }
    case enums.publicKey.dsa: {
      const { g, p, q } = publicKeyParams;
      const { x } = privateKeyParams;
      return sign$2(hashAlgo, hashed, g, p, q, x);
    }
    case enums.publicKey.elgamal:
      throw new Error("Signing with Elgamal is not defined in the OpenPGP standard.");
    case enums.publicKey.ecdsa: {
      const { oid, Q } = publicKeyParams;
      const { d } = privateKeyParams;
      return sign$4(oid, hashAlgo, data, Q, d, hashed);
    }
    case enums.publicKey.eddsaLegacy: {
      const { oid, Q } = publicKeyParams;
      const { seed } = privateKeyParams;
      return sign$3(oid, hashAlgo, data, Q, seed, hashed);
    }
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448: {
      const { A: A2 } = publicKeyParams;
      const { seed } = privateKeyParams;
      return sign$5(algo, hashAlgo, data, A2, seed, hashed);
    }
    default:
      throw new Error("Unknown signature algorithm.");
  }
}
var ARGON2_TYPE = 2;
var ARGON2_VERSION = 19;
var ARGON2_SALT_SIZE = 16;
var Argon2OutOfMemoryError = class _Argon2OutOfMemoryError extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _Argon2OutOfMemoryError);
    }
    this.name = "Argon2OutOfMemoryError";
  }
};
var loadArgonWasmModule;
var argon2Promise;
var ARGON2_WASM_MEMORY_THRESHOLD_RELOAD = 2 << 19;
var Argon2S2K = class {
  /**
  * @param {Object} [config] - Full configuration, defaults to openpgp.config
  */
  constructor(config$1 = config) {
    const { passes, parallelism, memoryExponent } = config$1.s2kArgon2Params;
    this.type = "argon2";
    this.salt = null;
    this.t = passes;
    this.p = parallelism;
    this.encodedM = memoryExponent;
  }
  generateSalt() {
    this.salt = getRandomBytes(ARGON2_SALT_SIZE);
  }
  /**
  * Parsing function for argon2 string-to-key specifier.
  * @param {Uint8Array} bytes - Payload of argon2 string-to-key specifier
  * @returns {Integer} Actual length of the object.
  */
  read(bytes2) {
    let i = 0;
    this.salt = bytes2.subarray(i, i + 16);
    i += 16;
    this.t = bytes2[i++];
    this.p = bytes2[i++];
    this.encodedM = bytes2[i++];
    return i;
  }
  /**
  * Serializes s2k information
  * @returns {Uint8Array} Binary representation of s2k.
  */
  write() {
    const arr = [
      new Uint8Array([enums.write(enums.s2k, this.type)]),
      this.salt,
      new Uint8Array([this.t, this.p, this.encodedM])
    ];
    return util.concatUint8Array(arr);
  }
  /**
  * Produces a key using the specified passphrase and the defined
  * hashAlgorithm
  * @param {String} passphrase - Passphrase containing user input
  * @returns {Promise<Uint8Array>} Produced key with a length corresponding to `keySize`
  * @throws {Argon2OutOfMemoryError|Errors}
  * @async
  */
  async produceKey(passphrase, keySize) {
    const decodedM = 2 << this.encodedM - 1;
    try {
      loadArgonWasmModule = loadArgonWasmModule || (await Promise.resolve().then(function() {
        return index$1;
      })).default;
      argon2Promise = argon2Promise || loadArgonWasmModule();
      const argon2 = await argon2Promise;
      const passwordBytes = util.encodeUTF8(passphrase);
      const hash2 = argon2({
        version: ARGON2_VERSION,
        type: ARGON2_TYPE,
        password: passwordBytes,
        salt: this.salt,
        tagLength: keySize,
        memorySize: decodedM,
        parallelism: this.p,
        passes: this.t
      });
      if (decodedM > ARGON2_WASM_MEMORY_THRESHOLD_RELOAD) {
        argon2Promise = loadArgonWasmModule();
        argon2Promise.catch(() => {
        });
      }
      return hash2;
    } catch (e) {
      if (e.message && (e.message.includes("Unable to grow instance memory") || // Chrome
      e.message.includes("failed to grow memory") || // Firefox
      e.message.includes("WebAssembly.Memory.grow") || // Safari
      e.message.includes("Out of memory"))) {
        throw new Argon2OutOfMemoryError("Could not allocate required memory for Argon2");
      } else {
        throw e;
      }
    }
  }
};
var GenericS2K = class {
  /**
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(s2kType, config$1 = config) {
    this.algorithm = enums.hash.sha256;
    this.type = enums.read(enums.s2k, s2kType);
    this.c = config$1.s2kIterationCountByte;
    this.salt = null;
  }
  generateSalt() {
    switch (this.type) {
      case "salted":
      case "iterated":
        this.salt = getRandomBytes(8);
    }
  }
  getCount() {
    const expbias = 6;
    return 16 + (this.c & 15) << (this.c >> 4) + expbias;
  }
  /**
   * Parsing function for a string-to-key specifier ({@link https://tools.ietf.org/html/rfc4880#section-3.7|RFC 4880 3.7}).
   * @param {Uint8Array} bytes - Payload of string-to-key specifier
   * @returns {Integer} Actual length of the object.
   */
  read(bytes2) {
    let i = 0;
    this.algorithm = bytes2[i++];
    switch (this.type) {
      case "simple":
        break;
      case "salted":
        this.salt = bytes2.subarray(i, i + 8);
        i += 8;
        break;
      case "iterated":
        this.salt = bytes2.subarray(i, i + 8);
        i += 8;
        this.c = bytes2[i++];
        break;
      case "gnu":
        if (util.uint8ArrayToString(bytes2.subarray(i, i + 3)) === "GNU") {
          i += 3;
          const gnuExtType = 1e3 + bytes2[i++];
          if (gnuExtType === 1001) {
            this.type = "gnu-dummy";
          } else {
            throw new UnsupportedError("Unknown s2k gnu protection mode.");
          }
        } else {
          throw new UnsupportedError("Unknown s2k type.");
        }
        break;
      default:
        throw new UnsupportedError("Unknown s2k type.");
    }
    return i;
  }
  /**
   * Serializes s2k information
   * @returns {Uint8Array} Binary representation of s2k.
   */
  write() {
    if (this.type === "gnu-dummy") {
      return new Uint8Array([101, 0, ...util.stringToUint8Array("GNU"), 1]);
    }
    const arr = [new Uint8Array([enums.write(enums.s2k, this.type), this.algorithm])];
    switch (this.type) {
      case "simple":
        break;
      case "salted":
        arr.push(this.salt);
        break;
      case "iterated":
        arr.push(this.salt);
        arr.push(new Uint8Array([this.c]));
        break;
      case "gnu":
        throw new Error("GNU s2k type not supported.");
      default:
        throw new Error("Unknown s2k type.");
    }
    return util.concatUint8Array(arr);
  }
  /**
   * Produces a key using the specified passphrase and the defined
   * hashAlgorithm
   * @param {String} passphrase - Passphrase containing user input
   * @returns {Promise<Uint8Array>} Produced key with a length corresponding to.
   * hashAlgorithm hash length
   * @async
   */
  async produceKey(passphrase, numBytes) {
    passphrase = util.encodeUTF8(passphrase);
    const arr = [];
    let rlength = 0;
    let prefixlen = 0;
    while (rlength < numBytes) {
      let toHash;
      switch (this.type) {
        case "simple":
          toHash = util.concatUint8Array([new Uint8Array(prefixlen), passphrase]);
          break;
        case "salted":
          toHash = util.concatUint8Array([new Uint8Array(prefixlen), this.salt, passphrase]);
          break;
        case "iterated": {
          const data = util.concatUint8Array([this.salt, passphrase]);
          let datalen = data.length;
          const count = Math.max(this.getCount(), datalen);
          toHash = new Uint8Array(prefixlen + count);
          toHash.set(data, prefixlen);
          for (let pos2 = prefixlen + datalen; pos2 < count; pos2 += datalen, datalen *= 2) {
            toHash.copyWithin(pos2, prefixlen, pos2);
          }
          break;
        }
        case "gnu":
          throw new Error("GNU s2k type not supported.");
        default:
          throw new Error("Unknown s2k type.");
      }
      const result = await computeDigest(this.algorithm, toHash);
      arr.push(result);
      rlength += result.length;
      prefixlen++;
    }
    return util.concatUint8Array(arr).subarray(0, numBytes);
  }
};
var allowedS2KTypesForEncryption = /* @__PURE__ */ new Set([enums.s2k.argon2, enums.s2k.iterated]);
function newS2KFromType(type, config$1 = config) {
  switch (type) {
    case enums.s2k.argon2:
      return new Argon2S2K(config$1);
    case enums.s2k.iterated:
    case enums.s2k.gnu:
    case enums.s2k.salted:
    case enums.s2k.simple:
      return new GenericS2K(type, config$1);
    default:
      throw new UnsupportedError("Unsupported S2K type");
  }
}
function newS2KFromConfig(config2) {
  const { s2kType } = config2;
  if (!allowedS2KTypesForEncryption.has(s2kType)) {
    throw new Error("The provided `config.s2kType` value is not allowed");
  }
  return newS2KFromType(s2kType, config2);
}
var require2 = createRequire("/");
var Worker;
try {
  Worker = require2("worker_threads").Worker;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var u32$1 = Uint32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new u32$1(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return [b, r];
};
var _a = freb(fleb, 2);
var fl = _a[0];
var revfl = _a[1];
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b[0];
var revfd = _b[1];
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >>> 1 | (i & 21845) << 1;
  x = (x & 52428) >>> 2 | (x & 13107) << 2;
  x = (x & 61680) >>> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >>> 8 | (x & 255) << 8) >>> 1;
}
var x;
var i;
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 0; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >>> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >>> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  var n = new (v.BYTES_PER_ELEMENT == 2 ? u16 : v.BYTES_PER_ELEMENT == 4 ? u32$1 : u8)(e - s);
  n.set(v.subarray(s, e));
  return n;
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, buf, st) {
  var sl = dat.length;
  if (!sl || st && st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf || st;
  var noSt = !st || st.i;
  if (!st)
    st = {};
  if (!buf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos2 = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos2, 1);
      var type = bits(dat, pos2 + 1, 3);
      pos2 += 3;
      if (!type) {
        var s = shft(pos2) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (noBuf)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos2 = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos2, 31) + 257, hcLen = bits(dat, pos2 + 10, 15) + 4;
        var tl = hLit + bits(dat, pos2 + 5, 31) + 1;
        pos2 += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos2 + i * 3, 7);
        }
        pos2 += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos2, clbmsk)];
          pos2 += r & 15;
          var s = r >>> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos2, 3), pos2 += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos2, 7), pos2 += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos2, 127), pos2 += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos2 > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (noBuf)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos2;
    for (; ; lpos = pos2) {
      var c = lm[bits16(dat, pos2) & lms], sym = c >>> 4;
      pos2 += c & 15;
      if (pos2 > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos2, lm = null;
        break;
      } else {
        var add2 = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add2 = bits(dat, pos2, (1 << b) - 1) + fl[i];
          pos2 += b;
        }
        var d = dm[bits16(dat, pos2) & dms], dsym = d >>> 4;
        if (!d)
          err(3);
        pos2 += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos2) & (1 << b) - 1, pos2 += b;
        }
        if (pos2 > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (noBuf)
          cbuf(bt + 131072);
        var end = bt + add2;
        for (; bt < end; bt += 4) {
          buf[bt] = buf[bt - dt];
          buf[bt + 1] = buf[bt + 1 - dt];
          buf[bt + 2] = buf[bt + 2 - dt];
          buf[bt + 3] = buf[bt + 3 - dt];
        }
        bt = end;
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt == buf.length ? buf : slc(buf, 0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >>> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >>> 8;
  d[o + 2] |= v >>> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return [et, 0];
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return [v, 1];
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return [new u8(tr), mbt];
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return [cl.subarray(0, cli), s];
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos2, dat) {
  var s = dat.length;
  var o = shft(pos2 + 2);
  out[o] = s & 255;
  out[o + 1] = s >>> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2[0], mlb = _a2[1];
  var _b2 = hTree(df, 15), ddt = _b2[0], mdb = _b2[1];
  var _c = lc(dlt), lclt = _c[0], nlc = _c[1];
  var _d = lc(ddt), lcdt = _d[0], ndc = _d[1];
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    lcfreq[lclt[i] & 31]++;
  for (var i = 0; i < lcdt.length; ++i)
    lcfreq[lcdt[i] & 31]++;
  var _e = hTree(lcfreq, 7), lct = _e[0], mlcb = _e[1];
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + (2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18]);
  if (flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >>> 5 & 127), p += clct[i] >>> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    if (syms[i] > 255) {
      var len = syms[i] >>> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, syms[i] >>> 23 & 31), p += fleb[len];
      var dst = syms[i] & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, syms[i] >>> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[syms[i]]), p += ll[syms[i]];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new u32$1([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, lst) {
  var s = dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var pos2 = 0;
  if (!lvl || s < 8) {
    for (var i = 0; i <= s; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos2 >> 3] = lst;
      }
      pos2 = wfblk(w, pos2 + 1, dat.subarray(i, e));
    }
  } else {
    var opt = deo[lvl - 1];
    var n = opt >>> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = new u16(32768), head = new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new u32$1(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = 0, li = 0, wi = 0, bs = 0;
    for (; i < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && rem > 423) {
          pos2 = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos2);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j + 32768 & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti + 32768 & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod + 32768 & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    pos2 = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos2);
    if (!lst && pos2 & 7)
      pos2 = wfblk(w, pos2 + 1, et);
  }
  return slc(o, 0, pre + shft(pos2) + post);
};
var adler = function() {
  var a = 1, b = 0;
  return {
    p: function(d) {
      var n = a, m = b;
      var l = d.length | 0;
      for (var i = 0; i != l; ) {
        var e = Math.min(i + 2655, l);
        for (; i < e; ++i)
          m += n += d[i];
        n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
      }
      a = n, b = m;
    },
    d: function() {
      a %= 65521, b %= 65521;
      return (a & 255) << 24 | a >>> 8 << 16 | (b & 255) << 8 | b >>> 8;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 12 + opt.mem, pre, post, !st);
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
var zlh = function(c, o) {
  var lv = o.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
  c[0] = 120, c[1] = fl2 << 6 | (fl2 ? 32 - 2 * fl2 : 1);
};
var Deflate = /* @__PURE__ */ function() {
  function Deflate2(opts, cb) {
    if (!cb && typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    this.o = opts || {};
  }
  Deflate2.prototype.p = function(c, f2) {
    this.ondata(dopt(c, this.o, 0, 0, !f2), f2);
  };
  Deflate2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    if (this.d)
      err(4);
    this.d = final;
    this.p(chunk, final || false);
  };
  return Deflate2;
}();
var Inflate = /* @__PURE__ */ function() {
  function Inflate2(cb) {
    this.s = {};
    this.p = new u8(0);
    this.ondata = cb;
  }
  Inflate2.prototype.e = function(c) {
    if (!this.ondata)
      err(5);
    if (this.d)
      err(4);
    var l = this.p.length;
    var n = new u8(l + c.length);
    n.set(this.p), n.set(c, l), this.p = n;
  };
  Inflate2.prototype.c = function(final) {
    this.d = this.s.i = final || false;
    var bts = this.s.b;
    var dt = inflt(this.p, this.o, this.s);
    this.ondata(slc(dt, bts, this.s.b), this.d);
    this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
    this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
  };
  Inflate2.prototype.push = function(chunk, final) {
    this.e(chunk), this.c(final);
  };
  return Inflate2;
}();
var Zlib2 = /* @__PURE__ */ function() {
  function Zlib3(opts, cb) {
    this.c = adler();
    this.v = 1;
    Deflate.call(this, opts, cb);
  }
  Zlib3.prototype.push = function(chunk, final) {
    Deflate.prototype.push.call(this, chunk, final);
  };
  Zlib3.prototype.p = function(c, f2) {
    this.c.p(c);
    var raw2 = dopt(c, this.o, this.v && 2, f2 && 4, !f2);
    if (this.v)
      zlh(raw2, this.o), this.v = 0;
    if (f2)
      wbytes(raw2, raw2.length - 4, this.c.d());
    this.ondata(raw2, f2);
  };
  return Zlib3;
}();
var Unzlib = /* @__PURE__ */ function() {
  function Unzlib2(cb) {
    this.v = 1;
    Inflate.call(this, cb);
  }
  Unzlib2.prototype.push = function(chunk, final) {
    Inflate.prototype.e.call(this, chunk);
    if (this.v) {
      if (this.p.length < 2 && !final)
        return;
      this.p = this.p.subarray(2), this.v = 0;
    }
    if (final) {
      if (this.p.length < 4)
        err(6, "invalid zlib data");
      this.p = this.p.subarray(0, -4);
    }
    Inflate.prototype.c.call(this, final);
  };
  return Unzlib2;
}();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var LiteralDataPacket = class {
  static get tag() {
    return enums.packet.literalData;
  }
  /**
   * @param {Date} date - The creation date of the literal package
   */
  constructor(date = /* @__PURE__ */ new Date()) {
    this.format = enums.literal.utf8;
    this.date = util.normalizeDate(date);
    this.text = null;
    this.data = null;
    this.filename = "";
  }
  /**
   * Set the packet data to a javascript native string, end of line
   * will be normalized to \r\n and by default text is converted to UTF8
   * @param {String | ReadableStream<String>} text - Any native javascript string
   * @param {enums.literal} [format] - The format of the string of bytes
   */
  setText(text, format = enums.literal.utf8) {
    this.format = format;
    this.text = text;
    this.data = null;
  }
  /**
   * Returns literal data packets as native JavaScript string
   * with normalized end of line to \n
   * @param {Boolean} [clone] - Whether to return a clone so that getBytes/getText can be called again
   * @returns {String | ReadableStream<String>} Literal data as text.
   */
  getText(clone2 = false) {
    if (this.text === null || util.isStream(this.text)) {
      this.text = util.decodeUTF8(util.nativeEOL(this.getBytes(clone2)));
    }
    return this.text;
  }
  /**
   * Set the packet data to value represented by the provided string of bytes.
   * @param {Uint8Array | ReadableStream<Uint8Array>} bytes - The string of bytes
   * @param {enums.literal} format - The format of the string of bytes
   */
  setBytes(bytes2, format) {
    this.format = format;
    this.data = bytes2;
    this.text = null;
  }
  /**
   * Get the byte sequence representing the literal packet data
   * @param {Boolean} [clone] - Whether to return a clone so that getBytes/getText can be called again
   * @returns {Uint8Array | ReadableStream<Uint8Array>} A sequence of bytes.
   */
  getBytes(clone2 = false) {
    if (this.data === null) {
      this.data = util.canonicalizeEOL(util.encodeUTF8(this.text));
    }
    if (clone2) {
      return passiveClone(this.data);
    }
    return this.data;
  }
  /**
   * Sets the filename of the literal packet data
   * @param {String} filename - Any native javascript string
   */
  setFilename(filename) {
    this.filename = filename;
  }
  /**
   * Get the filename of the literal packet data
   * @returns {String} Filename.
   */
  getFilename() {
    return this.filename;
  }
  /**
   * Parsing function for a literal data packet (tag 11).
   *
   * @param {Uint8Array | ReadableStream<Uint8Array>} input - Payload of a tag 11 packet
   * @returns {Promise<LiteralDataPacket>} Object representation.
   * @async
   */
  async read(bytes2) {
    await parse5(bytes2, async (reader) => {
      const format = await reader.readByte();
      const filename_len = await reader.readByte();
      this.filename = util.decodeUTF8(await reader.readBytes(filename_len));
      this.date = util.readDate(await reader.readBytes(4));
      let data = reader.remainder();
      if (isArrayStream(data)) data = await readToEnd(data);
      this.setBytes(data, format);
    });
  }
  /**
   * Creates a Uint8Array representation of the packet, excluding the data
   *
   * @returns {Uint8Array} Uint8Array representation of the packet.
   */
  writeHeader() {
    const filename = util.encodeUTF8(this.filename);
    const filename_length = new Uint8Array([filename.length]);
    const format = new Uint8Array([this.format]);
    const date = util.writeDate(this.date);
    return util.concatUint8Array([format, filename_length, filename, date]);
  }
  /**
   * Creates a Uint8Array representation of the packet
   *
   * @returns {Uint8Array | ReadableStream<Uint8Array>} Uint8Array representation of the packet.
   */
  write() {
    const header = this.writeHeader();
    const data = this.getBytes();
    return util.concat([header, data]);
  }
};
var KeyID = class _KeyID {
  constructor() {
    this.bytes = "";
  }
  /**
   * Parsing method for a key id
   * @param {Uint8Array} bytes - Input to read the key id from
   */
  read(bytes2) {
    this.bytes = util.uint8ArrayToString(bytes2.subarray(0, 8));
    return this.bytes.length;
  }
  /**
   * Serializes the Key ID
   * @returns {Uint8Array} Key ID as a Uint8Array.
   */
  write() {
    return util.stringToUint8Array(this.bytes);
  }
  /**
   * Returns the Key ID represented as a hexadecimal string
   * @returns {String} Key ID as a hexadecimal string.
   */
  toHex() {
    return util.uint8ArrayToHex(util.stringToUint8Array(this.bytes));
  }
  /**
   * Checks equality of Key ID's
   * @param {KeyID} keyID
   * @param {Boolean} matchWildcard - Indicates whether to check if either keyID is a wildcard
   */
  equals(keyID, matchWildcard = false) {
    return matchWildcard && (keyID.isWildcard() || this.isWildcard()) || this.bytes === keyID.bytes;
  }
  /**
   * Checks to see if the Key ID is unset
   * @returns {Boolean} True if the Key ID is null.
   */
  isNull() {
    return this.bytes === "";
  }
  /**
   * Checks to see if the Key ID is a "wildcard" Key ID (all zeros)
   * @returns {Boolean} True if this is a wildcard Key ID.
   */
  isWildcard() {
    return /^0+$/.test(this.toHex());
  }
  static mapToHex(keyID) {
    return keyID.toHex();
  }
  static fromID(hex) {
    const keyID = new _KeyID();
    keyID.read(util.hexToUint8Array(hex));
    return keyID;
  }
  static wildcard() {
    const keyID = new _KeyID();
    keyID.read(new Uint8Array(8));
    return keyID;
  }
};
var verified = Symbol("verified");
var SALT_NOTATION_NAME = "salt@notations.openpgpjs.org";
var allowedUnhashedSubpackets = /* @__PURE__ */ new Set([
  enums.signatureSubpacket.issuerKeyID,
  enums.signatureSubpacket.issuerFingerprint,
  enums.signatureSubpacket.embeddedSignature
]);
var SignaturePacket = class _SignaturePacket {
  static get tag() {
    return enums.packet.signature;
  }
  constructor() {
    this.version = null;
    this.signatureType = null;
    this.hashAlgorithm = null;
    this.publicKeyAlgorithm = null;
    this.signatureData = null;
    this.unhashedSubpackets = [];
    this.unknownSubpackets = [];
    this.signedHashValue = null;
    this.salt = null;
    this.created = null;
    this.signatureExpirationTime = null;
    this.signatureNeverExpires = true;
    this.exportable = null;
    this.trustLevel = null;
    this.trustAmount = null;
    this.regularExpression = null;
    this.revocable = null;
    this.keyExpirationTime = null;
    this.keyNeverExpires = null;
    this.preferredSymmetricAlgorithms = null;
    this.revocationKeyClass = null;
    this.revocationKeyAlgorithm = null;
    this.revocationKeyFingerprint = null;
    this.issuerKeyID = new KeyID();
    this.rawNotations = [];
    this.notations = {};
    this.preferredHashAlgorithms = null;
    this.preferredCompressionAlgorithms = null;
    this.keyServerPreferences = null;
    this.preferredKeyServer = null;
    this.isPrimaryUserID = null;
    this.policyURI = null;
    this.keyFlags = null;
    this.signersUserID = null;
    this.reasonForRevocationFlag = null;
    this.reasonForRevocationString = null;
    this.features = null;
    this.signatureTargetPublicKeyAlgorithm = null;
    this.signatureTargetHashAlgorithm = null;
    this.signatureTargetHash = null;
    this.embeddedSignature = null;
    this.issuerKeyVersion = null;
    this.issuerFingerprint = null;
    this.preferredAEADAlgorithms = null;
    this.preferredCipherSuites = null;
    this.revoked = null;
    this[verified] = null;
  }
  /**
   * parsing function for a signature packet (tag 2).
   * @param {String} bytes - Payload of a tag 2 packet
   * @returns {SignaturePacket} Object representation.
   */
  read(bytes2, config$1 = config) {
    let i = 0;
    this.version = bytes2[i++];
    if (this.version === 5 && !config$1.enableParsingV5Entities) {
      throw new UnsupportedError("Support for v5 entities is disabled; turn on `config.enableParsingV5Entities` if needed");
    }
    if (this.version !== 4 && this.version !== 5 && this.version !== 6) {
      throw new UnsupportedError(`Version ${this.version} of the signature packet is unsupported.`);
    }
    this.signatureType = bytes2[i++];
    this.publicKeyAlgorithm = bytes2[i++];
    this.hashAlgorithm = bytes2[i++];
    i += this.readSubPackets(bytes2.subarray(i, bytes2.length), true);
    if (!this.created) {
      throw new Error("Missing signature creation time subpacket.");
    }
    this.signatureData = bytes2.subarray(0, i);
    i += this.readSubPackets(bytes2.subarray(i, bytes2.length), false);
    this.signedHashValue = bytes2.subarray(i, i + 2);
    i += 2;
    if (this.version === 6) {
      const saltLength = bytes2[i++];
      this.salt = bytes2.subarray(i, i + saltLength);
      i += saltLength;
    }
    const signatureMaterial = bytes2.subarray(i, bytes2.length);
    const { read, signatureParams } = parseSignatureParams(this.publicKeyAlgorithm, signatureMaterial);
    if (read < signatureMaterial.length) {
      throw new Error("Error reading MPIs");
    }
    this.params = signatureParams;
  }
  /**
   * @returns {Uint8Array | ReadableStream<Uint8Array>}
   */
  writeParams() {
    if (this.params instanceof Promise) {
      return fromAsync(
        async () => serializeParams(this.publicKeyAlgorithm, await this.params)
      );
    }
    return serializeParams(this.publicKeyAlgorithm, this.params);
  }
  write() {
    const arr = [];
    arr.push(this.signatureData);
    arr.push(this.writeUnhashedSubPackets());
    arr.push(this.signedHashValue);
    if (this.version === 6) {
      arr.push(new Uint8Array([this.salt.length]));
      arr.push(this.salt);
    }
    arr.push(this.writeParams());
    return util.concat(arr);
  }
  /**
   * Signs provided data. This needs to be done prior to serialization.
   * @param {SecretKeyPacket} key - Private key used to sign the message.
   * @param {Object} data - Contains packets to be signed.
   * @param {Date} [date] - The signature creation time.
   * @param {Boolean} [detached] - Whether to create a detached signature
   * @throws {Error} if signing failed
   * @async
   */
  async sign(key, data, date = /* @__PURE__ */ new Date(), detached = false, config2) {
    this.version = key.version;
    this.created = util.normalizeDate(date);
    this.issuerKeyVersion = key.version;
    this.issuerFingerprint = key.getFingerprintBytes();
    this.issuerKeyID = key.getKeyID();
    const arr = [new Uint8Array([this.version, this.signatureType, this.publicKeyAlgorithm, this.hashAlgorithm])];
    if (this.version === 6) {
      const saltLength = saltLengthForHash(this.hashAlgorithm);
      if (this.salt === null) {
        this.salt = getRandomBytes(saltLength);
      } else if (saltLength !== this.salt.length) {
        throw new Error("Provided salt does not have the required length");
      }
    } else if (config2.nonDeterministicSignaturesViaNotation) {
      const saltNotations = this.rawNotations.filter(({ name: name2 }) => name2 === SALT_NOTATION_NAME);
      if (saltNotations.length === 0) {
        const saltValue = getRandomBytes(saltLengthForHash(this.hashAlgorithm));
        this.rawNotations.push({
          name: SALT_NOTATION_NAME,
          value: saltValue,
          humanReadable: false,
          critical: false
        });
      } else {
        throw new Error("Unexpected existing salt notation");
      }
    }
    arr.push(this.writeHashedSubPackets());
    this.unhashedSubpackets = [];
    this.signatureData = util.concat(arr);
    const toHash = this.toHash(this.signatureType, data, detached);
    const hash2 = await this.hash(this.signatureType, data, toHash, detached);
    this.signedHashValue = slice(clone(hash2), 0, 2);
    const signed = async () => sign$1(
      this.publicKeyAlgorithm,
      this.hashAlgorithm,
      key.publicParams,
      key.privateParams,
      toHash,
      await readToEnd(hash2)
    );
    if (util.isStream(hash2)) {
      this.params = signed();
    } else {
      this.params = await signed();
      this[verified] = true;
    }
  }
  /**
   * Creates Uint8Array of bytes of all subpacket data except Issuer and Embedded Signature subpackets
   * @returns {Uint8Array} Subpacket data.
   */
  writeHashedSubPackets() {
    const sub = enums.signatureSubpacket;
    const arr = [];
    let bytes2;
    if (this.created === null) {
      throw new Error("Missing signature creation time");
    }
    arr.push(writeSubPacket(sub.signatureCreationTime, true, util.writeDate(this.created)));
    if (this.signatureExpirationTime !== null) {
      arr.push(writeSubPacket(sub.signatureExpirationTime, true, util.writeNumber(this.signatureExpirationTime, 4)));
    }
    if (this.exportable !== null) {
      arr.push(writeSubPacket(sub.exportableCertification, true, new Uint8Array([this.exportable ? 1 : 0])));
    }
    if (this.trustLevel !== null) {
      bytes2 = new Uint8Array([this.trustLevel, this.trustAmount]);
      arr.push(writeSubPacket(sub.trustSignature, true, bytes2));
    }
    if (this.regularExpression !== null) {
      arr.push(writeSubPacket(sub.regularExpression, true, this.regularExpression));
    }
    if (this.revocable !== null) {
      arr.push(writeSubPacket(sub.revocable, true, new Uint8Array([this.revocable ? 1 : 0])));
    }
    if (this.keyExpirationTime !== null) {
      arr.push(writeSubPacket(sub.keyExpirationTime, true, util.writeNumber(this.keyExpirationTime, 4)));
    }
    if (this.preferredSymmetricAlgorithms !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.preferredSymmetricAlgorithms));
      arr.push(writeSubPacket(sub.preferredSymmetricAlgorithms, false, bytes2));
    }
    if (this.revocationKeyClass !== null) {
      bytes2 = new Uint8Array([this.revocationKeyClass, this.revocationKeyAlgorithm]);
      bytes2 = util.concat([bytes2, this.revocationKeyFingerprint]);
      arr.push(writeSubPacket(sub.revocationKey, false, bytes2));
    }
    if (!this.issuerKeyID.isNull() && this.issuerKeyVersion < 5) {
      arr.push(writeSubPacket(sub.issuerKeyID, true, this.issuerKeyID.write()));
    }
    this.rawNotations.forEach(({ name: name2, value, humanReadable, critical }) => {
      bytes2 = [new Uint8Array([humanReadable ? 128 : 0, 0, 0, 0])];
      const encodedName = util.encodeUTF8(name2);
      bytes2.push(util.writeNumber(encodedName.length, 2));
      bytes2.push(util.writeNumber(value.length, 2));
      bytes2.push(encodedName);
      bytes2.push(value);
      bytes2 = util.concat(bytes2);
      arr.push(writeSubPacket(sub.notationData, critical, bytes2));
    });
    if (this.preferredHashAlgorithms !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.preferredHashAlgorithms));
      arr.push(writeSubPacket(sub.preferredHashAlgorithms, false, bytes2));
    }
    if (this.preferredCompressionAlgorithms !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.preferredCompressionAlgorithms));
      arr.push(writeSubPacket(sub.preferredCompressionAlgorithms, false, bytes2));
    }
    if (this.keyServerPreferences !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.keyServerPreferences));
      arr.push(writeSubPacket(sub.keyServerPreferences, false, bytes2));
    }
    if (this.preferredKeyServer !== null) {
      arr.push(writeSubPacket(sub.preferredKeyServer, false, util.encodeUTF8(this.preferredKeyServer)));
    }
    if (this.isPrimaryUserID !== null) {
      arr.push(writeSubPacket(sub.primaryUserID, false, new Uint8Array([this.isPrimaryUserID ? 1 : 0])));
    }
    if (this.policyURI !== null) {
      arr.push(writeSubPacket(sub.policyURI, false, util.encodeUTF8(this.policyURI)));
    }
    if (this.keyFlags !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.keyFlags));
      arr.push(writeSubPacket(sub.keyFlags, true, bytes2));
    }
    if (this.signersUserID !== null) {
      arr.push(writeSubPacket(sub.signersUserID, false, util.encodeUTF8(this.signersUserID)));
    }
    if (this.reasonForRevocationFlag !== null) {
      bytes2 = util.stringToUint8Array(String.fromCharCode(this.reasonForRevocationFlag) + this.reasonForRevocationString);
      arr.push(writeSubPacket(sub.reasonForRevocation, true, bytes2));
    }
    if (this.features !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.features));
      arr.push(writeSubPacket(sub.features, false, bytes2));
    }
    if (this.signatureTargetPublicKeyAlgorithm !== null) {
      bytes2 = [new Uint8Array([this.signatureTargetPublicKeyAlgorithm, this.signatureTargetHashAlgorithm])];
      bytes2.push(util.stringToUint8Array(this.signatureTargetHash));
      bytes2 = util.concat(bytes2);
      arr.push(writeSubPacket(sub.signatureTarget, true, bytes2));
    }
    if (this.embeddedSignature !== null) {
      arr.push(writeSubPacket(sub.embeddedSignature, true, this.embeddedSignature.write()));
    }
    if (this.issuerFingerprint !== null) {
      bytes2 = [new Uint8Array([this.issuerKeyVersion]), this.issuerFingerprint];
      bytes2 = util.concat(bytes2);
      arr.push(writeSubPacket(sub.issuerFingerprint, this.version >= 5, bytes2));
    }
    if (this.preferredAEADAlgorithms !== null) {
      bytes2 = util.stringToUint8Array(util.uint8ArrayToString(this.preferredAEADAlgorithms));
      arr.push(writeSubPacket(sub.preferredAEADAlgorithms, false, bytes2));
    }
    if (this.preferredCipherSuites !== null) {
      bytes2 = new Uint8Array([].concat(...this.preferredCipherSuites));
      arr.push(writeSubPacket(sub.preferredCipherSuites, false, bytes2));
    }
    const result = util.concat(arr);
    const length = util.writeNumber(result.length, this.version === 6 ? 4 : 2);
    return util.concat([length, result]);
  }
  /**
   * Creates an Uint8Array containing the unhashed subpackets
   * @returns {Uint8Array} Subpacket data.
   */
  writeUnhashedSubPackets() {
    const arr = this.unhashedSubpackets.map(({ type, critical, body }) => {
      return writeSubPacket(type, critical, body);
    });
    const result = util.concat(arr);
    const length = util.writeNumber(result.length, this.version === 6 ? 4 : 2);
    return util.concat([length, result]);
  }
  // Signature subpackets
  readSubPacket(bytes2, hashed = true) {
    let mypos = 0;
    const critical = !!(bytes2[mypos] & 128);
    const type = bytes2[mypos] & 127;
    mypos++;
    if (!hashed) {
      this.unhashedSubpackets.push({
        type,
        critical,
        body: bytes2.subarray(mypos, bytes2.length)
      });
      if (!allowedUnhashedSubpackets.has(type)) {
        return;
      }
    }
    switch (type) {
      case enums.signatureSubpacket.signatureCreationTime:
        this.created = util.readDate(bytes2.subarray(mypos, bytes2.length));
        break;
      case enums.signatureSubpacket.signatureExpirationTime: {
        const seconds = util.readNumber(bytes2.subarray(mypos, bytes2.length));
        this.signatureNeverExpires = seconds === 0;
        this.signatureExpirationTime = seconds;
        break;
      }
      case enums.signatureSubpacket.exportableCertification:
        this.exportable = bytes2[mypos++] === 1;
        break;
      case enums.signatureSubpacket.trustSignature:
        this.trustLevel = bytes2[mypos++];
        this.trustAmount = bytes2[mypos++];
        break;
      case enums.signatureSubpacket.regularExpression:
        this.regularExpression = bytes2[mypos];
        break;
      case enums.signatureSubpacket.revocable:
        this.revocable = bytes2[mypos++] === 1;
        break;
      case enums.signatureSubpacket.keyExpirationTime: {
        const seconds = util.readNumber(bytes2.subarray(mypos, bytes2.length));
        this.keyExpirationTime = seconds;
        this.keyNeverExpires = seconds === 0;
        break;
      }
      case enums.signatureSubpacket.preferredSymmetricAlgorithms:
        this.preferredSymmetricAlgorithms = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.revocationKey:
        this.revocationKeyClass = bytes2[mypos++];
        this.revocationKeyAlgorithm = bytes2[mypos++];
        this.revocationKeyFingerprint = bytes2.subarray(mypos, mypos + 20);
        break;
      case enums.signatureSubpacket.issuerKeyID:
        if (this.version === 4) {
          this.issuerKeyID.read(bytes2.subarray(mypos, bytes2.length));
        } else if (hashed) {
          throw new Error("Unexpected Issuer Key ID subpacket");
        }
        break;
      case enums.signatureSubpacket.notationData: {
        const humanReadable = !!(bytes2[mypos] & 128);
        mypos += 4;
        const m = util.readNumber(bytes2.subarray(mypos, mypos + 2));
        mypos += 2;
        const n = util.readNumber(bytes2.subarray(mypos, mypos + 2));
        mypos += 2;
        const name2 = util.decodeUTF8(bytes2.subarray(mypos, mypos + m));
        const value = bytes2.subarray(mypos + m, mypos + m + n);
        this.rawNotations.push({ name: name2, humanReadable, value, critical });
        if (humanReadable) {
          this.notations[name2] = util.decodeUTF8(value);
        }
        break;
      }
      case enums.signatureSubpacket.preferredHashAlgorithms:
        this.preferredHashAlgorithms = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.preferredCompressionAlgorithms:
        this.preferredCompressionAlgorithms = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.keyServerPreferences:
        this.keyServerPreferences = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.preferredKeyServer:
        this.preferredKeyServer = util.decodeUTF8(bytes2.subarray(mypos, bytes2.length));
        break;
      case enums.signatureSubpacket.primaryUserID:
        this.isPrimaryUserID = bytes2[mypos++] !== 0;
        break;
      case enums.signatureSubpacket.policyURI:
        this.policyURI = util.decodeUTF8(bytes2.subarray(mypos, bytes2.length));
        break;
      case enums.signatureSubpacket.keyFlags:
        this.keyFlags = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.signersUserID:
        this.signersUserID = util.decodeUTF8(bytes2.subarray(mypos, bytes2.length));
        break;
      case enums.signatureSubpacket.reasonForRevocation:
        this.reasonForRevocationFlag = bytes2[mypos++];
        this.reasonForRevocationString = util.decodeUTF8(bytes2.subarray(mypos, bytes2.length));
        break;
      case enums.signatureSubpacket.features:
        this.features = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.signatureTarget: {
        this.signatureTargetPublicKeyAlgorithm = bytes2[mypos++];
        this.signatureTargetHashAlgorithm = bytes2[mypos++];
        const len = getHashByteLength(this.signatureTargetHashAlgorithm);
        this.signatureTargetHash = util.uint8ArrayToString(bytes2.subarray(mypos, mypos + len));
        break;
      }
      case enums.signatureSubpacket.embeddedSignature:
        this.embeddedSignature = new _SignaturePacket();
        this.embeddedSignature.read(bytes2.subarray(mypos, bytes2.length));
        break;
      case enums.signatureSubpacket.issuerFingerprint:
        this.issuerKeyVersion = bytes2[mypos++];
        this.issuerFingerprint = bytes2.subarray(mypos, bytes2.length);
        if (this.issuerKeyVersion >= 5) {
          this.issuerKeyID.read(this.issuerFingerprint);
        } else {
          this.issuerKeyID.read(this.issuerFingerprint.subarray(-8));
        }
        break;
      case enums.signatureSubpacket.preferredAEADAlgorithms:
        this.preferredAEADAlgorithms = [...bytes2.subarray(mypos, bytes2.length)];
        break;
      case enums.signatureSubpacket.preferredCipherSuites:
        this.preferredCipherSuites = [];
        for (let i = mypos; i < bytes2.length; i += 2) {
          this.preferredCipherSuites.push([bytes2[i], bytes2[i + 1]]);
        }
        break;
      default:
        this.unknownSubpackets.push({
          type,
          critical,
          body: bytes2.subarray(mypos, bytes2.length)
        });
        break;
    }
  }
  readSubPackets(bytes2, trusted = true, config2) {
    const subpacketLengthBytes = this.version === 6 ? 4 : 2;
    const subpacketLength = util.readNumber(bytes2.subarray(0, subpacketLengthBytes));
    let i = subpacketLengthBytes;
    while (i < 2 + subpacketLength) {
      const len = readSimpleLength(bytes2.subarray(i, bytes2.length));
      i += len.offset;
      this.readSubPacket(bytes2.subarray(i, i + len.len), trusted, config2);
      i += len.len;
    }
    return i;
  }
  // Produces data to produce signature on
  toSign(type, data) {
    const t = enums.signature;
    switch (type) {
      case t.binary:
        if (data.text !== null) {
          return util.encodeUTF8(data.getText(true));
        }
        return data.getBytes(true);
      case t.text: {
        const bytes2 = data.getBytes(true);
        return util.canonicalizeEOL(bytes2);
      }
      case t.standalone:
        return new Uint8Array(0);
      case t.certGeneric:
      case t.certPersona:
      case t.certCasual:
      case t.certPositive:
      case t.certRevocation: {
        let packet;
        let tag;
        if (data.userID) {
          tag = 180;
          packet = data.userID;
        } else if (data.userAttribute) {
          tag = 209;
          packet = data.userAttribute;
        } else {
          throw new Error("Either a userID or userAttribute packet needs to be supplied for certification.");
        }
        const bytes2 = packet.write();
        return util.concat([
          this.toSign(t.key, data),
          new Uint8Array([tag]),
          util.writeNumber(bytes2.length, 4),
          bytes2
        ]);
      }
      case t.subkeyBinding:
      case t.subkeyRevocation:
      case t.keyBinding:
        return util.concat([this.toSign(t.key, data), this.toSign(t.key, {
          key: data.bind
        })]);
      case t.key:
        if (data.key === void 0) {
          throw new Error("Key packet is required for this signature.");
        }
        return data.key.writeForHash(this.version);
      case t.keyRevocation:
        return this.toSign(t.key, data);
      case t.timestamp:
        return new Uint8Array(0);
      case t.thirdParty:
        throw new Error("Not implemented");
      default:
        throw new Error("Unknown signature type.");
    }
  }
  calculateTrailer(data, detached) {
    let length = 0;
    return transform(clone(this.signatureData), (value) => {
      length += value.length;
    }, () => {
      const arr = [];
      if (this.version === 5 && (this.signatureType === enums.signature.binary || this.signatureType === enums.signature.text)) {
        if (detached) {
          arr.push(new Uint8Array(6));
        } else {
          arr.push(data.writeHeader());
        }
      }
      arr.push(new Uint8Array([this.version, 255]));
      if (this.version === 5) {
        arr.push(new Uint8Array(4));
      }
      arr.push(util.writeNumber(length, 4));
      return util.concat(arr);
    });
  }
  toHash(signatureType, data, detached = false) {
    const bytes2 = this.toSign(signatureType, data);
    return util.concat([this.salt || new Uint8Array(), bytes2, this.signatureData, this.calculateTrailer(data, detached)]);
  }
  async hash(signatureType, data, toHash, detached = false) {
    if (this.version === 6 && this.salt.length !== saltLengthForHash(this.hashAlgorithm)) {
      throw new Error("Signature salt does not have the expected length");
    }
    if (!toHash) toHash = this.toHash(signatureType, data, detached);
    return computeDigest(this.hashAlgorithm, toHash);
  }
  /**
   * verifies the signature packet. Note: not all signature types are implemented
   * @param {PublicSubkeyPacket|PublicKeyPacket|
   *         SecretSubkeyPacket|SecretKeyPacket} key - the public key to verify the signature
   * @param {module:enums.signature} signatureType - Expected signature type
   * @param {Uint8Array|Object} data - Data which on the signature applies
   * @param {Date} [date] - Use the given date instead of the current time to check for signature validity and expiration
   * @param {Boolean} [detached] - Whether to verify a detached signature
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @throws {Error} if signature validation failed
   * @async
   */
  async verify(key, signatureType, data, date = /* @__PURE__ */ new Date(), detached = false, config$1 = config) {
    if (!this.issuerKeyID.equals(key.getKeyID())) {
      throw new Error("Signature was not issued by the given public key");
    }
    if (this.publicKeyAlgorithm !== key.algorithm) {
      throw new Error("Public key algorithm used to sign signature does not match issuer key algorithm.");
    }
    const isMessageSignature = signatureType === enums.signature.binary || signatureType === enums.signature.text;
    const skipVerify = this[verified] && !isMessageSignature;
    if (!skipVerify) {
      let toHash;
      let hash2;
      if (this.hashed) {
        hash2 = await this.hashed;
      } else {
        toHash = this.toHash(signatureType, data, detached);
        hash2 = await this.hash(signatureType, data, toHash);
      }
      hash2 = await readToEnd(hash2);
      if (this.signedHashValue[0] !== hash2[0] || this.signedHashValue[1] !== hash2[1]) {
        throw new Error("Signed digest did not match");
      }
      this.params = await this.params;
      this[verified] = await verify$1(
        this.publicKeyAlgorithm,
        this.hashAlgorithm,
        this.params,
        key.publicParams,
        toHash,
        hash2
      );
      if (!this[verified]) {
        throw new Error("Signature verification failed");
      }
    }
    const normDate = util.normalizeDate(date);
    if (normDate && this.created > normDate) {
      throw new Error("Signature creation time is in the future");
    }
    if (normDate && normDate >= this.getExpirationTime()) {
      throw new Error("Signature is expired");
    }
    if (config$1.rejectHashAlgorithms.has(this.hashAlgorithm)) {
      throw new Error("Insecure hash algorithm: " + enums.read(enums.hash, this.hashAlgorithm).toUpperCase());
    }
    if (config$1.rejectMessageHashAlgorithms.has(this.hashAlgorithm) && [enums.signature.binary, enums.signature.text].includes(this.signatureType)) {
      throw new Error("Insecure message hash algorithm: " + enums.read(enums.hash, this.hashAlgorithm).toUpperCase());
    }
    this.unknownSubpackets.forEach(({ type, critical }) => {
      if (critical) {
        throw new Error(`Unknown critical signature subpacket type ${type}`);
      }
    });
    this.rawNotations.forEach(({ name: name2, critical }) => {
      if (critical && config$1.knownNotations.indexOf(name2) < 0) {
        throw new Error(`Unknown critical notation: ${name2}`);
      }
    });
    if (this.revocationKeyClass !== null) {
      throw new Error("This key is intended to be revoked with an authorized key, which OpenPGP.js does not support.");
    }
  }
  /**
   * Verifies signature expiration date
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @returns {Boolean} True if expired.
   */
  isExpired(date = /* @__PURE__ */ new Date()) {
    const normDate = util.normalizeDate(date);
    if (normDate !== null) {
      return !(this.created <= normDate && normDate < this.getExpirationTime());
    }
    return false;
  }
  /**
   * Returns the expiration time of the signature or Infinity if signature does not expire
   * @returns {Date | Infinity} Expiration time.
   */
  getExpirationTime() {
    return this.signatureNeverExpires ? Infinity : new Date(this.created.getTime() + this.signatureExpirationTime * 1e3);
  }
};
function writeSubPacket(type, critical, data) {
  const arr = [];
  arr.push(writeSimpleLength(data.length + 1));
  arr.push(new Uint8Array([(critical ? 128 : 0) | type]));
  arr.push(data);
  return util.concat(arr);
}
function saltLengthForHash(hashAlgorithm) {
  switch (hashAlgorithm) {
    case enums.hash.sha256:
      return 16;
    case enums.hash.sha384:
      return 24;
    case enums.hash.sha512:
      return 32;
    case enums.hash.sha224:
      return 16;
    case enums.hash.sha3_256:
      return 16;
    case enums.hash.sha3_512:
      return 32;
    default:
      throw new Error("Unsupported hash function");
  }
}
var OnePassSignaturePacket = class _OnePassSignaturePacket {
  static get tag() {
    return enums.packet.onePassSignature;
  }
  static fromSignaturePacket(signaturePacket, isLast) {
    const onePassSig = new _OnePassSignaturePacket();
    onePassSig.version = signaturePacket.version === 6 ? 6 : 3;
    onePassSig.signatureType = signaturePacket.signatureType;
    onePassSig.hashAlgorithm = signaturePacket.hashAlgorithm;
    onePassSig.publicKeyAlgorithm = signaturePacket.publicKeyAlgorithm;
    onePassSig.issuerKeyID = signaturePacket.issuerKeyID;
    onePassSig.salt = signaturePacket.salt;
    onePassSig.issuerFingerprint = signaturePacket.issuerFingerprint;
    onePassSig.flags = isLast ? 1 : 0;
    return onePassSig;
  }
  constructor() {
    this.version = null;
    this.signatureType = null;
    this.hashAlgorithm = null;
    this.publicKeyAlgorithm = null;
    this.salt = null;
    this.issuerKeyID = null;
    this.issuerFingerprint = null;
    this.flags = null;
  }
  /**
   * parsing function for a one-pass signature packet (tag 4).
   * @param {Uint8Array} bytes - Payload of a tag 4 packet
   * @returns {OnePassSignaturePacket} Object representation.
   */
  read(bytes2) {
    let mypos = 0;
    this.version = bytes2[mypos++];
    if (this.version !== 3 && this.version !== 6) {
      throw new UnsupportedError(`Version ${this.version} of the one-pass signature packet is unsupported.`);
    }
    this.signatureType = bytes2[mypos++];
    this.hashAlgorithm = bytes2[mypos++];
    this.publicKeyAlgorithm = bytes2[mypos++];
    if (this.version === 6) {
      const saltLength = bytes2[mypos++];
      this.salt = bytes2.subarray(mypos, mypos + saltLength);
      mypos += saltLength;
      this.issuerFingerprint = bytes2.subarray(mypos, mypos + 32);
      mypos += 32;
      this.issuerKeyID = new KeyID();
      this.issuerKeyID.read(this.issuerFingerprint);
    } else {
      this.issuerKeyID = new KeyID();
      this.issuerKeyID.read(bytes2.subarray(mypos, mypos + 8));
      mypos += 8;
    }
    this.flags = bytes2[mypos++];
    return this;
  }
  /**
   * creates a string representation of a one-pass signature packet
   * @returns {Uint8Array} A Uint8Array representation of a one-pass signature packet.
   */
  write() {
    const arr = [new Uint8Array([
      this.version,
      this.signatureType,
      this.hashAlgorithm,
      this.publicKeyAlgorithm
    ])];
    if (this.version === 6) {
      arr.push(
        new Uint8Array([this.salt.length]),
        this.salt,
        this.issuerFingerprint
      );
    } else {
      arr.push(this.issuerKeyID.write());
    }
    arr.push(new Uint8Array([this.flags]));
    return util.concatUint8Array(arr);
  }
  calculateTrailer(...args) {
    return fromAsync(async () => SignaturePacket.prototype.calculateTrailer.apply(await this.correspondingSig, args));
  }
  async verify() {
    const correspondingSig = await this.correspondingSig;
    if (!correspondingSig || correspondingSig.constructor.tag !== enums.packet.signature) {
      throw new Error("Corresponding signature packet missing");
    }
    if (correspondingSig.signatureType !== this.signatureType || correspondingSig.hashAlgorithm !== this.hashAlgorithm || correspondingSig.publicKeyAlgorithm !== this.publicKeyAlgorithm || !correspondingSig.issuerKeyID.equals(this.issuerKeyID) || this.version === 3 && correspondingSig.version === 6 || this.version === 6 && correspondingSig.version !== 6 || this.version === 6 && !util.equalsUint8Array(correspondingSig.issuerFingerprint, this.issuerFingerprint) || this.version === 6 && !util.equalsUint8Array(correspondingSig.salt, this.salt)) {
      throw new Error("Corresponding signature packet does not match one-pass signature packet");
    }
    correspondingSig.hashed = this.hashed;
    return correspondingSig.verify.apply(correspondingSig, arguments);
  }
};
OnePassSignaturePacket.prototype.hash = SignaturePacket.prototype.hash;
OnePassSignaturePacket.prototype.toHash = SignaturePacket.prototype.toHash;
OnePassSignaturePacket.prototype.toSign = SignaturePacket.prototype.toSign;
function newPacketFromTag(tag, allowedPackets) {
  if (!allowedPackets[tag]) {
    let packetType;
    try {
      packetType = enums.read(enums.packet, tag);
    } catch (e) {
      throw new UnknownPacketError(`Unknown packet type with tag: ${tag}`);
    }
    throw new Error(`Packet not allowed in this context: ${packetType}`);
  }
  return new allowedPackets[tag]();
}
var PacketList = class _PacketList extends Array {
  /**
   * Parses the given binary data and returns a list of packets.
   * Equivalent to calling `read` on an empty PacketList instance.
   * @param {Uint8Array | ReadableStream<Uint8Array>} bytes - binary data to parse
   * @param {Object} allowedPackets - mapping where keys are allowed packet tags, pointing to their Packet class
   * @param {Object} [config] - full configuration, defaults to openpgp.config
   * @returns {PacketList} parsed list of packets
   * @throws on parsing errors
   * @async
   */
  static async fromBinary(bytes2, allowedPackets, config$1 = config) {
    const packets = new _PacketList();
    await packets.read(bytes2, allowedPackets, config$1);
    return packets;
  }
  /**
   * Reads a stream of binary data and interprets it as a list of packets.
   * @param {Uint8Array | ReadableStream<Uint8Array>} bytes - binary data to parse
   * @param {Object} allowedPackets - mapping where keys are allowed packet tags, pointing to their Packet class
   * @param {Object} [config] - full configuration, defaults to openpgp.config
   * @throws on parsing errors
   * @async
   */
  async read(bytes2, allowedPackets, config$1 = config) {
    if (config$1.additionalAllowedPackets.length) {
      allowedPackets = { ...allowedPackets, ...util.constructAllowedPackets(config$1.additionalAllowedPackets) };
    }
    this.stream = transformPair(bytes2, async (readable, writable) => {
      const writer = getWriter(writable);
      try {
        while (true) {
          await writer.ready;
          const done = await readPackets(readable, async (parsed) => {
            try {
              if (parsed.tag === enums.packet.marker || parsed.tag === enums.packet.trust || parsed.tag === enums.packet.padding) {
                return;
              }
              const packet = newPacketFromTag(parsed.tag, allowedPackets);
              packet.packets = new _PacketList();
              packet.fromStream = util.isStream(parsed.packet);
              await packet.read(parsed.packet, config$1);
              await writer.write(packet);
            } catch (e) {
              if (e instanceof UnknownPacketError) {
                if (parsed.tag <= 39) {
                  await writer.abort(e);
                } else {
                  return;
                }
              }
              const throwUnsupportedError = !config$1.ignoreUnsupportedPackets && e instanceof UnsupportedError;
              const throwMalformedError = !config$1.ignoreMalformedPackets && !(e instanceof UnsupportedError);
              if (throwUnsupportedError || throwMalformedError || supportsStreaming(parsed.tag)) {
                await writer.abort(e);
              } else {
                const unparsedPacket = new UnparseablePacket(parsed.tag, parsed.packet);
                await writer.write(unparsedPacket);
              }
              util.printDebugError(e);
            }
          });
          if (done) {
            await writer.ready;
            await writer.close();
            return;
          }
        }
      } catch (e) {
        await writer.abort(e);
      }
    });
    const reader = getReader(this.stream);
    while (true) {
      const { done, value } = await reader.read();
      if (!done) {
        this.push(value);
      } else {
        this.stream = null;
      }
      if (done || supportsStreaming(value.constructor.tag)) {
        break;
      }
    }
    reader.releaseLock();
  }
  /**
   * Creates a binary representation of openpgp objects contained within the
   * class instance.
   * @returns {Uint8Array} A Uint8Array containing valid openpgp packets.
   */
  write() {
    const arr = [];
    for (let i = 0; i < this.length; i++) {
      const tag = this[i] instanceof UnparseablePacket ? this[i].tag : this[i].constructor.tag;
      const packetbytes = this[i].write();
      if (util.isStream(packetbytes) && supportsStreaming(this[i].constructor.tag)) {
        let buffer = [];
        let bufferLength = 0;
        const minLength = 512;
        arr.push(writeTag(tag));
        arr.push(transform(packetbytes, (value) => {
          buffer.push(value);
          bufferLength += value.length;
          if (bufferLength >= minLength) {
            const powerOf2 = Math.min(Math.log(bufferLength) / Math.LN2 | 0, 30);
            const chunkSize = 2 ** powerOf2;
            const bufferConcat = util.concat([writePartialLength(powerOf2)].concat(buffer));
            buffer = [bufferConcat.subarray(1 + chunkSize)];
            bufferLength = buffer[0].length;
            return bufferConcat.subarray(0, 1 + chunkSize);
          }
        }, () => util.concat([writeSimpleLength(bufferLength)].concat(buffer))));
      } else {
        if (util.isStream(packetbytes)) {
          let length = 0;
          arr.push(transform(clone(packetbytes), (value) => {
            length += value.length;
          }, () => writeHeader(tag, length)));
        } else {
          arr.push(writeHeader(tag, packetbytes.length));
        }
        arr.push(packetbytes);
      }
    }
    return util.concat(arr);
  }
  /**
   * Creates a new PacketList with all packets matching the given tag(s)
   * @param {...module:enums.packet} tags - packet tags to look for
   * @returns {PacketList}
   */
  filterByTag(...tags) {
    const filtered = new _PacketList();
    const handle = (tag) => (packetType) => tag === packetType;
    for (let i = 0; i < this.length; i++) {
      if (tags.some(handle(this[i].constructor.tag))) {
        filtered.push(this[i]);
      }
    }
    return filtered;
  }
  /**
   * Traverses packet list and returns first packet with matching tag
   * @param {module:enums.packet} tag - The packet tag
   * @returns {Packet|undefined}
   */
  findPacket(tag) {
    return this.find((packet) => packet.constructor.tag === tag);
  }
  /**
   * Find indices of packets with the given tag(s)
   * @param {...module:enums.packet} tags - packet tags to look for
   * @returns {Integer[]} packet indices
   */
  indexOfTag(...tags) {
    const tagIndex = [];
    const that = this;
    const handle = (tag) => (packetType) => tag === packetType;
    for (let i = 0; i < this.length; i++) {
      if (tags.some(handle(that[i].constructor.tag))) {
        tagIndex.push(i);
      }
    }
    return tagIndex;
  }
};
var allowedPackets$5 = /* @__PURE__ */ util.constructAllowedPackets([
  LiteralDataPacket,
  OnePassSignaturePacket,
  SignaturePacket
]);
var CompressedDataPacket = class {
  static get tag() {
    return enums.packet.compressedData;
  }
  /**
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(config$1 = config) {
    this.packets = null;
    this.algorithm = config$1.preferredCompressionAlgorithm;
    this.compressed = null;
  }
  /**
   * Parsing function for the packet.
   * @param {Uint8Array | ReadableStream<Uint8Array>} bytes - Payload of a tag 8 packet
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  async read(bytes2, config$1 = config) {
    await parse5(bytes2, async (reader) => {
      this.algorithm = await reader.readByte();
      this.compressed = reader.remainder();
      await this.decompress(config$1);
    });
  }
  /**
   * Return the compressed packet.
   * @returns {Uint8Array | ReadableStream<Uint8Array>} Binary compressed packet.
   */
  write() {
    if (this.compressed === null) {
      this.compress();
    }
    return util.concat([new Uint8Array([this.algorithm]), this.compressed]);
  }
  /**
   * Decompression method for decompressing the compressed data
   * read by read_packet
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  async decompress(config$1 = config) {
    const compressionName = enums.read(enums.compression, this.algorithm);
    const decompressionFn = decompress_fns[compressionName];
    if (!decompressionFn) {
      throw new Error(`${compressionName} decompression not supported`);
    }
    this.packets = await PacketList.fromBinary(await decompressionFn(this.compressed), allowedPackets$5, config$1);
  }
  /**
   * Compress the packet data (member decompressedData)
   */
  compress() {
    const compressionName = enums.read(enums.compression, this.algorithm);
    const compressionFn = compress_fns[compressionName];
    if (!compressionFn) {
      throw new Error(`${compressionName} compression not supported`);
    }
    this.compressed = compressionFn(this.packets.write());
  }
};
function zlib(compressionStreamInstantiator, ZlibStreamedConstructor) {
  return (data) => {
    if (!util.isStream(data) || isArrayStream(data)) {
      return fromAsync(() => readToEnd(data).then((inputData) => {
        return new Promise((resolve2, reject) => {
          const zlibStream2 = new ZlibStreamedConstructor();
          zlibStream2.ondata = (processedData) => {
            resolve2(processedData);
          };
          try {
            zlibStream2.push(inputData, true);
          } catch (err2) {
            reject(err2);
          }
        });
      }));
    }
    if (compressionStreamInstantiator) {
      try {
        const compressorOrDecompressor = compressionStreamInstantiator();
        return data.pipeThrough(compressorOrDecompressor);
      } catch (err2) {
        if (err2.name !== "TypeError") {
          throw err2;
        }
      }
    }
    const inputReader = data.getReader();
    const zlibStream = new ZlibStreamedConstructor();
    return new ReadableStream({
      async start(controller) {
        zlibStream.ondata = async (value, isLast) => {
          controller.enqueue(value);
          if (isLast) {
            controller.close();
          }
        };
        while (true) {
          const { done, value } = await inputReader.read();
          if (done) {
            zlibStream.push(new Uint8Array(), true);
            return;
          } else if (value.length) {
            zlibStream.push(value);
          }
        }
      }
    });
  };
}
function bzip2Decompress() {
  return async function(data) {
    const { decode: bunzipDecode } = await Promise.resolve().then(function() {
      return index;
    });
    return fromAsync(async () => bunzipDecode(await readToEnd(data)));
  };
}
var getCompressionStreamInstantiators = (compressionFormat) => ({
  compressor: typeof CompressionStream !== "undefined" && (() => new CompressionStream(compressionFormat)),
  decompressor: typeof DecompressionStream !== "undefined" && (() => new DecompressionStream(compressionFormat))
});
var compress_fns = {
  zip: /* @__PURE__ */ zlib(getCompressionStreamInstantiators("deflate-raw").compressor, Deflate),
  zlib: /* @__PURE__ */ zlib(getCompressionStreamInstantiators("deflate").compressor, Zlib2)
};
var decompress_fns = {
  uncompressed: (data) => data,
  zip: /* @__PURE__ */ zlib(getCompressionStreamInstantiators("deflate-raw").decompressor, Inflate),
  zlib: /* @__PURE__ */ zlib(getCompressionStreamInstantiators("deflate").decompressor, Unzlib),
  bzip2: /* @__PURE__ */ bzip2Decompress()
  // NB: async due to dynamic lib import
};
var allowedPackets$4 = /* @__PURE__ */ util.constructAllowedPackets([
  LiteralDataPacket,
  CompressedDataPacket,
  OnePassSignaturePacket,
  SignaturePacket
]);
var SymEncryptedIntegrityProtectedDataPacket = class _SymEncryptedIntegrityProtectedDataPacket {
  static get tag() {
    return enums.packet.symEncryptedIntegrityProtectedData;
  }
  static fromObject({ version: version2, aeadAlgorithm }) {
    if (version2 !== 1 && version2 !== 2) {
      throw new Error("Unsupported SEIPD version");
    }
    const seip = new _SymEncryptedIntegrityProtectedDataPacket();
    seip.version = version2;
    if (version2 === 2) {
      seip.aeadAlgorithm = aeadAlgorithm;
    }
    return seip;
  }
  constructor() {
    this.version = null;
    this.cipherAlgorithm = null;
    this.aeadAlgorithm = null;
    this.chunkSizeByte = null;
    this.salt = null;
    this.encrypted = null;
    this.packets = null;
  }
  async read(bytes2) {
    await parse5(bytes2, async (reader) => {
      this.version = await reader.readByte();
      if (this.version !== 1 && this.version !== 2) {
        throw new UnsupportedError(`Version ${this.version} of the SEIP packet is unsupported.`);
      }
      if (this.version === 2) {
        this.cipherAlgorithm = await reader.readByte();
        this.aeadAlgorithm = await reader.readByte();
        this.chunkSizeByte = await reader.readByte();
        this.salt = await reader.readBytes(32);
      }
      this.encrypted = reader.remainder();
    });
  }
  write() {
    if (this.version === 2) {
      return util.concat([new Uint8Array([this.version, this.cipherAlgorithm, this.aeadAlgorithm, this.chunkSizeByte]), this.salt, this.encrypted]);
    }
    return util.concat([new Uint8Array([this.version]), this.encrypted]);
  }
  /**
   * Encrypt the payload in the packet.
   * @param {enums.symmetric} sessionKeyAlgorithm - The symmetric encryption algorithm to use
   * @param {Uint8Array} key - The key of cipher blocksize length to be used
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Boolean>}
   * @throws {Error} on encryption failure
   * @async
   */
  async encrypt(sessionKeyAlgorithm, key, config$1 = config) {
    const { blockSize, keySize } = getCipherParams(sessionKeyAlgorithm);
    if (key.length !== keySize) {
      throw new Error("Unexpected session key size");
    }
    let bytes2 = this.packets.write();
    if (isArrayStream(bytes2)) bytes2 = await readToEnd(bytes2);
    if (this.version === 2) {
      this.cipherAlgorithm = sessionKeyAlgorithm;
      this.salt = getRandomBytes(32);
      this.chunkSizeByte = config$1.aeadChunkSizeByte;
      this.encrypted = await runAEAD(this, "encrypt", key, bytes2);
    } else {
      const prefix = await getPrefixRandom(sessionKeyAlgorithm);
      const mdc = new Uint8Array([211, 20]);
      const tohash = util.concat([prefix, bytes2, mdc]);
      const hash2 = await computeDigest(enums.hash.sha1, passiveClone(tohash));
      const plaintext = util.concat([tohash, hash2]);
      this.encrypted = await encrypt$1(sessionKeyAlgorithm, key, plaintext, new Uint8Array(blockSize));
    }
    return true;
  }
  /**
   * Decrypts the encrypted data contained in the packet.
   * @param {enums.symmetric} sessionKeyAlgorithm - The selected symmetric encryption algorithm to be used
   * @param {Uint8Array} key - The key of cipher blocksize length to be used
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Boolean>}
   * @throws {Error} on decryption failure
   * @async
   */
  async decrypt(sessionKeyAlgorithm, key, config$1 = config) {
    if (key.length !== getCipherParams(sessionKeyAlgorithm).keySize) {
      throw new Error("Unexpected session key size");
    }
    let encrypted = clone(this.encrypted);
    if (isArrayStream(encrypted)) encrypted = await readToEnd(encrypted);
    let packetbytes;
    if (this.version === 2) {
      if (this.cipherAlgorithm !== sessionKeyAlgorithm) {
        throw new Error("Unexpected session key algorithm");
      }
      packetbytes = await runAEAD(this, "decrypt", key, encrypted);
    } else {
      const { blockSize } = getCipherParams(sessionKeyAlgorithm);
      const decrypted = await decrypt$1(sessionKeyAlgorithm, key, encrypted, new Uint8Array(blockSize));
      const realHash = slice(passiveClone(decrypted), -20);
      const tohash = slice(decrypted, 0, -20);
      const verifyHash = Promise.all([
        readToEnd(await computeDigest(enums.hash.sha1, passiveClone(tohash))),
        readToEnd(realHash)
      ]).then(([hash2, mdc]) => {
        if (!util.equalsUint8Array(hash2, mdc)) {
          throw new Error("Modification detected.");
        }
        return new Uint8Array();
      });
      const bytes2 = slice(tohash, blockSize + 2);
      packetbytes = slice(bytes2, 0, -2);
      packetbytes = concat([packetbytes, fromAsync(() => verifyHash)]);
      if (!util.isStream(encrypted) || !config$1.allowUnauthenticatedStream) {
        packetbytes = await readToEnd(packetbytes);
      }
    }
    this.packets = await PacketList.fromBinary(packetbytes, allowedPackets$4, config$1);
    return true;
  }
};
async function runAEAD(packet, fn, key, data) {
  const isSEIPDv2 = packet instanceof SymEncryptedIntegrityProtectedDataPacket && packet.version === 2;
  const isAEADP = !isSEIPDv2 && packet.constructor.tag === enums.packet.aeadEncryptedData;
  if (!isSEIPDv2 && !isAEADP) throw new Error("Unexpected packet type");
  const mode = getAEADMode(packet.aeadAlgorithm, isAEADP);
  const tagLengthIfDecrypting = fn === "decrypt" ? mode.tagLength : 0;
  const tagLengthIfEncrypting = fn === "encrypt" ? mode.tagLength : 0;
  const chunkSize = 2 ** (packet.chunkSizeByte + 6) + tagLengthIfDecrypting;
  const chunkIndexSizeIfAEADEP = isAEADP ? 8 : 0;
  const adataBuffer = new ArrayBuffer(13 + chunkIndexSizeIfAEADEP);
  const adataArray = new Uint8Array(adataBuffer, 0, 5 + chunkIndexSizeIfAEADEP);
  const adataTagArray = new Uint8Array(adataBuffer);
  const adataView = new DataView(adataBuffer);
  const chunkIndexArray = new Uint8Array(adataBuffer, 5, 8);
  adataArray.set([192 | packet.constructor.tag, packet.version, packet.cipherAlgorithm, packet.aeadAlgorithm, packet.chunkSizeByte], 0);
  let chunkIndex = 0;
  let latestPromise = Promise.resolve();
  let cryptedBytes = 0;
  let queuedBytes = 0;
  let iv;
  let ivView;
  if (isSEIPDv2) {
    const { keySize } = getCipherParams(packet.cipherAlgorithm);
    const { ivLength: ivLength2 } = mode;
    const info = new Uint8Array(adataBuffer, 0, 5);
    const derived = await computeHKDF(enums.hash.sha256, key, packet.salt, info, keySize + ivLength2);
    key = derived.subarray(0, keySize);
    iv = derived.subarray(keySize);
    iv.fill(0, iv.length - 8);
    ivView = new DataView(iv.buffer, iv.byteOffset, iv.byteLength);
  } else {
    iv = packet.iv;
  }
  const modeInstance = await mode(packet.cipherAlgorithm, key);
  return transformPair(data, async (readable, writable) => {
    if (util.isStream(readable) !== "array") {
      const buffer = new TransformStream({}, {
        highWaterMark: util.getHardwareConcurrency() * 2 ** (packet.chunkSizeByte + 6),
        size: (array) => array.length
      });
      pipe(buffer.readable, writable);
      writable = buffer.writable;
    }
    const reader = getReader(readable);
    const writer = getWriter(writable);
    try {
      while (true) {
        let chunk = await reader.readBytes(chunkSize + tagLengthIfDecrypting) || new Uint8Array();
        const finalChunk = chunk.subarray(chunk.length - tagLengthIfDecrypting);
        chunk = chunk.subarray(0, chunk.length - tagLengthIfDecrypting);
        let cryptedPromise;
        let done;
        let nonce;
        if (isSEIPDv2) {
          nonce = iv;
        } else {
          nonce = iv.slice();
          for (let i = 0; i < 8; i++) {
            nonce[iv.length - 8 + i] ^= chunkIndexArray[i];
          }
        }
        if (!chunkIndex || chunk.length) {
          reader.unshift(finalChunk);
          cryptedPromise = modeInstance[fn](chunk, nonce, adataArray);
          cryptedPromise.catch(() => {
          });
          queuedBytes += chunk.length - tagLengthIfDecrypting + tagLengthIfEncrypting;
        } else {
          adataView.setInt32(5 + chunkIndexSizeIfAEADEP + 4, cryptedBytes);
          cryptedPromise = modeInstance[fn](finalChunk, nonce, adataTagArray);
          cryptedPromise.catch(() => {
          });
          queuedBytes += tagLengthIfEncrypting;
          done = true;
        }
        cryptedBytes += chunk.length - tagLengthIfDecrypting;
        latestPromise = latestPromise.then(() => cryptedPromise).then(async (crypted) => {
          await writer.ready;
          await writer.write(crypted);
          queuedBytes -= crypted.length;
        }).catch((err2) => writer.abort(err2));
        if (done || queuedBytes > writer.desiredSize) {
          await latestPromise;
        }
        if (!done) {
          if (isSEIPDv2) {
            ivView.setInt32(iv.length - 4, ++chunkIndex);
          } else {
            adataView.setInt32(5 + 4, ++chunkIndex);
          }
        } else {
          await writer.close();
          break;
        }
      }
    } catch (e) {
      await writer.ready.catch(() => {
      });
      await writer.abort(e);
    }
  });
}
var PublicKeyEncryptedSessionKeyPacket = class _PublicKeyEncryptedSessionKeyPacket {
  static get tag() {
    return enums.packet.publicKeyEncryptedSessionKey;
  }
  constructor() {
    this.version = null;
    this.publicKeyID = new KeyID();
    this.publicKeyVersion = null;
    this.publicKeyFingerprint = null;
    this.publicKeyAlgorithm = null;
    this.sessionKey = null;
    this.sessionKeyAlgorithm = null;
    this.encrypted = {};
  }
  static fromObject({
    version: version2,
    encryptionKeyPacket,
    anonymousRecipient,
    sessionKey,
    sessionKeyAlgorithm
  }) {
    const pkesk = new _PublicKeyEncryptedSessionKeyPacket();
    if (version2 !== 3 && version2 !== 6) {
      throw new Error("Unsupported PKESK version");
    }
    pkesk.version = version2;
    if (version2 === 6) {
      pkesk.publicKeyVersion = anonymousRecipient ? null : encryptionKeyPacket.version;
      pkesk.publicKeyFingerprint = anonymousRecipient ? null : encryptionKeyPacket.getFingerprintBytes();
    }
    pkesk.publicKeyID = anonymousRecipient ? KeyID.wildcard() : encryptionKeyPacket.getKeyID();
    pkesk.publicKeyAlgorithm = encryptionKeyPacket.algorithm;
    pkesk.sessionKey = sessionKey;
    pkesk.sessionKeyAlgorithm = sessionKeyAlgorithm;
    return pkesk;
  }
  /**
   * Parsing function for a publickey encrypted session key packet (tag 1).
   *
   * @param {Uint8Array} bytes - Payload of a tag 1 packet
   */
  read(bytes2) {
    let offset = 0;
    this.version = bytes2[offset++];
    if (this.version !== 3 && this.version !== 6) {
      throw new UnsupportedError(`Version ${this.version} of the PKESK packet is unsupported.`);
    }
    if (this.version === 6) {
      const versionAndFingerprintLength = bytes2[offset++];
      if (versionAndFingerprintLength) {
        this.publicKeyVersion = bytes2[offset++];
        const fingerprintLength = versionAndFingerprintLength - 1;
        this.publicKeyFingerprint = bytes2.subarray(offset, offset + fingerprintLength);
        offset += fingerprintLength;
        if (this.publicKeyVersion >= 5) {
          this.publicKeyID.read(this.publicKeyFingerprint);
        } else {
          this.publicKeyID.read(this.publicKeyFingerprint.subarray(-8));
        }
      } else {
        this.publicKeyID = KeyID.wildcard();
      }
    } else {
      offset += this.publicKeyID.read(bytes2.subarray(offset, offset + 8));
    }
    this.publicKeyAlgorithm = bytes2[offset++];
    this.encrypted = parseEncSessionKeyParams(this.publicKeyAlgorithm, bytes2.subarray(offset));
    if (this.publicKeyAlgorithm === enums.publicKey.x25519 || this.publicKeyAlgorithm === enums.publicKey.x448) {
      if (this.version === 3) {
        this.sessionKeyAlgorithm = enums.write(enums.symmetric, this.encrypted.C.algorithm);
      } else if (this.encrypted.C.algorithm !== null) {
        throw new Error("Unexpected cleartext symmetric algorithm");
      }
    }
  }
  /**
   * Create a binary representation of a tag 1 packet
   *
   * @returns {Uint8Array} The Uint8Array representation.
   */
  write() {
    const arr = [
      new Uint8Array([this.version])
    ];
    if (this.version === 6) {
      if (this.publicKeyFingerprint !== null) {
        arr.push(new Uint8Array(
          [
            this.publicKeyFingerprint.length + 1,
            this.publicKeyVersion
          ]
        ));
        arr.push(this.publicKeyFingerprint);
      } else {
        arr.push(new Uint8Array([0]));
      }
    } else {
      arr.push(this.publicKeyID.write());
    }
    arr.push(
      new Uint8Array([this.publicKeyAlgorithm]),
      serializeParams(this.publicKeyAlgorithm, this.encrypted)
    );
    return util.concatUint8Array(arr);
  }
  /**
   * Encrypt session key packet
   * @param {PublicKeyPacket} key - Public key
   * @throws {Error} if encryption failed
   * @async
   */
  async encrypt(key) {
    const algo = enums.write(enums.publicKey, this.publicKeyAlgorithm);
    const sessionKeyAlgorithm = this.version === 3 ? this.sessionKeyAlgorithm : null;
    const fingerprint = key.version === 5 ? key.getFingerprintBytes().subarray(0, 20) : key.getFingerprintBytes();
    const encoded = encodeSessionKey(this.version, algo, sessionKeyAlgorithm, this.sessionKey);
    this.encrypted = await publicKeyEncrypt(
      algo,
      sessionKeyAlgorithm,
      key.publicParams,
      encoded,
      fingerprint
    );
  }
  /**
   * Decrypts the session key (only for public key encrypted session key packets (tag 1)
   * @param {SecretKeyPacket} key - decrypted private key
   * @param {Object} [randomSessionKey] - Bogus session key to use in case of sensitive decryption error, or if the decrypted session key is of a different type/size.
   *                                      This is needed for constant-time processing. Expected object of the form: { sessionKey: Uint8Array, sessionKeyAlgorithm: enums.symmetric }
   * @throws {Error} if decryption failed, unless `randomSessionKey` is given
   * @async
   */
  async decrypt(key, randomSessionKey) {
    if (this.publicKeyAlgorithm !== key.algorithm) {
      throw new Error("Decryption error");
    }
    const randomPayload = randomSessionKey ? encodeSessionKey(this.version, this.publicKeyAlgorithm, randomSessionKey.sessionKeyAlgorithm, randomSessionKey.sessionKey) : null;
    const fingerprint = key.version === 5 ? key.getFingerprintBytes().subarray(0, 20) : key.getFingerprintBytes();
    const decryptedData = await publicKeyDecrypt(this.publicKeyAlgorithm, key.publicParams, key.privateParams, this.encrypted, fingerprint, randomPayload);
    const { sessionKey, sessionKeyAlgorithm } = decodeSessionKey(this.version, this.publicKeyAlgorithm, decryptedData, randomSessionKey);
    if (this.version === 3) {
      const hasEncryptedAlgo = this.publicKeyAlgorithm !== enums.publicKey.x25519 && this.publicKeyAlgorithm !== enums.publicKey.x448;
      this.sessionKeyAlgorithm = hasEncryptedAlgo ? sessionKeyAlgorithm : this.sessionKeyAlgorithm;
      if (sessionKey.length !== getCipherParams(this.sessionKeyAlgorithm).keySize) {
        throw new Error("Unexpected session key size");
      }
    }
    this.sessionKey = sessionKey;
  }
};
function encodeSessionKey(version2, keyAlgo, cipherAlgo, sessionKeyData) {
  switch (keyAlgo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.elgamal:
    case enums.publicKey.ecdh:
      return util.concatUint8Array([
        new Uint8Array(version2 === 6 ? [] : [cipherAlgo]),
        sessionKeyData,
        util.writeChecksum(sessionKeyData.subarray(sessionKeyData.length % 8))
      ]);
    case enums.publicKey.x25519:
    case enums.publicKey.x448:
      return sessionKeyData;
    default:
      throw new Error("Unsupported public key algorithm");
  }
}
function decodeSessionKey(version2, keyAlgo, decryptedData, randomSessionKey) {
  switch (keyAlgo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.elgamal:
    case enums.publicKey.ecdh: {
      const result = decryptedData.subarray(0, decryptedData.length - 2);
      const checksum = decryptedData.subarray(decryptedData.length - 2);
      const computedChecksum = util.writeChecksum(result.subarray(result.length % 8));
      const isValidChecksum = computedChecksum[0] === checksum[0] & computedChecksum[1] === checksum[1];
      const decryptedSessionKey = version2 === 6 ? { sessionKeyAlgorithm: null, sessionKey: result } : { sessionKeyAlgorithm: result[0], sessionKey: result.subarray(1) };
      if (randomSessionKey) {
        const isValidPayload = isValidChecksum & decryptedSessionKey.sessionKeyAlgorithm === randomSessionKey.sessionKeyAlgorithm & decryptedSessionKey.sessionKey.length === randomSessionKey.sessionKey.length;
        return {
          sessionKey: util.selectUint8Array(isValidPayload, decryptedSessionKey.sessionKey, randomSessionKey.sessionKey),
          sessionKeyAlgorithm: version2 === 6 ? null : util.selectUint8(
            isValidPayload,
            decryptedSessionKey.sessionKeyAlgorithm,
            randomSessionKey.sessionKeyAlgorithm
          )
        };
      } else {
        const isValidPayload = isValidChecksum && (version2 === 6 || enums.read(enums.symmetric, decryptedSessionKey.sessionKeyAlgorithm));
        if (isValidPayload) {
          return decryptedSessionKey;
        } else {
          throw new Error("Decryption error");
        }
      }
    }
    case enums.publicKey.x25519:
    case enums.publicKey.x448:
      return {
        sessionKeyAlgorithm: null,
        sessionKey: decryptedData
      };
    default:
      throw new Error("Unsupported public key algorithm");
  }
}
var SymEncryptedSessionKeyPacket = class _SymEncryptedSessionKeyPacket {
  static get tag() {
    return enums.packet.symEncryptedSessionKey;
  }
  /**
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(config$1 = config) {
    this.version = config$1.aeadProtect ? 6 : 4;
    this.sessionKey = null;
    this.sessionKeyEncryptionAlgorithm = null;
    this.sessionKeyAlgorithm = null;
    this.aeadAlgorithm = enums.write(enums.aead, config$1.preferredAEADAlgorithm);
    this.encrypted = null;
    this.s2k = null;
    this.iv = null;
  }
  /**
   * Parsing function for a symmetric encrypted session key packet (tag 3).
   *
   * @param {Uint8Array} bytes - Payload of a tag 3 packet
   */
  read(bytes2) {
    let offset = 0;
    this.version = bytes2[offset++];
    if (this.version !== 4 && this.version !== 5 && this.version !== 6) {
      throw new UnsupportedError(`Version ${this.version} of the SKESK packet is unsupported.`);
    }
    if (this.version === 6) {
      offset++;
    }
    const algo = bytes2[offset++];
    if (this.version >= 5) {
      this.aeadAlgorithm = bytes2[offset++];
      if (this.version === 6) {
        offset++;
      }
    }
    const s2kType = bytes2[offset++];
    this.s2k = newS2KFromType(s2kType);
    offset += this.s2k.read(bytes2.subarray(offset, bytes2.length));
    if (this.version >= 5) {
      const mode = getAEADMode(this.aeadAlgorithm, true);
      this.iv = bytes2.subarray(offset, offset += mode.ivLength);
    }
    if (this.version >= 5 || offset < bytes2.length) {
      this.encrypted = bytes2.subarray(offset, bytes2.length);
      this.sessionKeyEncryptionAlgorithm = algo;
    } else {
      this.sessionKeyAlgorithm = algo;
    }
  }
  /**
   * Create a binary representation of a tag 3 packet
   *
   * @returns {Uint8Array} The Uint8Array representation.
  */
  write() {
    const algo = this.encrypted === null ? this.sessionKeyAlgorithm : this.sessionKeyEncryptionAlgorithm;
    let bytes2;
    const s2k = this.s2k.write();
    if (this.version === 6) {
      const s2kLen = s2k.length;
      const fieldsLen = 3 + s2kLen + this.iv.length;
      bytes2 = util.concatUint8Array([new Uint8Array([this.version, fieldsLen, algo, this.aeadAlgorithm, s2kLen]), s2k, this.iv, this.encrypted]);
    } else if (this.version === 5) {
      bytes2 = util.concatUint8Array([new Uint8Array([this.version, algo, this.aeadAlgorithm]), s2k, this.iv, this.encrypted]);
    } else {
      bytes2 = util.concatUint8Array([new Uint8Array([this.version, algo]), s2k]);
      if (this.encrypted !== null) {
        bytes2 = util.concatUint8Array([bytes2, this.encrypted]);
      }
    }
    return bytes2;
  }
  /**
   * Decrypts the session key with the given passphrase
   * @param {String} passphrase - The passphrase in string form
   * @throws {Error} if decryption was not successful
   * @async
   */
  async decrypt(passphrase) {
    const algo = this.sessionKeyEncryptionAlgorithm !== null ? this.sessionKeyEncryptionAlgorithm : this.sessionKeyAlgorithm;
    const { blockSize, keySize } = getCipherParams(algo);
    const key = await this.s2k.produceKey(passphrase, keySize);
    if (this.version >= 5) {
      const mode = getAEADMode(this.aeadAlgorithm, true);
      const adata = new Uint8Array([192 | _SymEncryptedSessionKeyPacket.tag, this.version, this.sessionKeyEncryptionAlgorithm, this.aeadAlgorithm]);
      const encryptionKey = this.version === 6 ? await computeHKDF(enums.hash.sha256, key, new Uint8Array(), adata, keySize) : key;
      const modeInstance = await mode(algo, encryptionKey);
      this.sessionKey = await modeInstance.decrypt(this.encrypted, this.iv, adata);
    } else if (this.encrypted !== null) {
      const decrypted = await decrypt$1(algo, key, this.encrypted, new Uint8Array(blockSize));
      this.sessionKeyAlgorithm = enums.write(enums.symmetric, decrypted[0]);
      this.sessionKey = decrypted.subarray(1, decrypted.length);
      if (this.sessionKey.length !== getCipherParams(this.sessionKeyAlgorithm).keySize) {
        throw new Error("Unexpected session key size");
      }
    } else {
      this.sessionKey = key;
    }
  }
  /**
   * Encrypts the session key with the given passphrase
   * @param {String} passphrase - The passphrase in string form
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @throws {Error} if encryption was not successful
   * @async
   */
  async encrypt(passphrase, config$1 = config) {
    const algo = this.sessionKeyEncryptionAlgorithm !== null ? this.sessionKeyEncryptionAlgorithm : this.sessionKeyAlgorithm;
    this.sessionKeyEncryptionAlgorithm = algo;
    this.s2k = newS2KFromConfig(config$1);
    this.s2k.generateSalt();
    const { blockSize, keySize } = getCipherParams(algo);
    const key = await this.s2k.produceKey(passphrase, keySize);
    if (this.sessionKey === null) {
      this.sessionKey = generateSessionKey$1(this.sessionKeyAlgorithm);
    }
    if (this.version >= 5) {
      const mode = getAEADMode(this.aeadAlgorithm);
      this.iv = getRandomBytes(mode.ivLength);
      const adata = new Uint8Array([192 | _SymEncryptedSessionKeyPacket.tag, this.version, this.sessionKeyEncryptionAlgorithm, this.aeadAlgorithm]);
      const encryptionKey = this.version === 6 ? await computeHKDF(enums.hash.sha256, key, new Uint8Array(), adata, keySize) : key;
      const modeInstance = await mode(algo, encryptionKey);
      this.encrypted = await modeInstance.encrypt(this.sessionKey, this.iv, adata);
    } else {
      const toEncrypt = util.concatUint8Array([
        new Uint8Array([this.sessionKeyAlgorithm]),
        this.sessionKey
      ]);
      this.encrypted = await encrypt$1(algo, key, toEncrypt, new Uint8Array(blockSize));
    }
  }
};
var PublicKeyPacket = class _PublicKeyPacket {
  static get tag() {
    return enums.packet.publicKey;
  }
  /**
   * @param {Date} [date] - Creation date
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(date = /* @__PURE__ */ new Date(), config$1 = config) {
    this.version = config$1.v6Keys ? 6 : 4;
    this.created = util.normalizeDate(date);
    this.algorithm = null;
    this.publicParams = null;
    this.expirationTimeV3 = 0;
    this.fingerprint = null;
    this.keyID = null;
  }
  /**
   * Create a PublicKeyPacket from a SecretKeyPacket
   * @param {SecretKeyPacket} secretKeyPacket - key packet to convert
   * @returns {PublicKeyPacket} public key packet
   * @static
   */
  static fromSecretKeyPacket(secretKeyPacket) {
    const keyPacket = new _PublicKeyPacket();
    const { version: version2, created, algorithm, publicParams, keyID, fingerprint } = secretKeyPacket;
    keyPacket.version = version2;
    keyPacket.created = created;
    keyPacket.algorithm = algorithm;
    keyPacket.publicParams = publicParams;
    keyPacket.keyID = keyID;
    keyPacket.fingerprint = fingerprint;
    return keyPacket;
  }
  /**
   * Internal Parser for public keys as specified in {@link https://tools.ietf.org/html/rfc4880#section-5.5.2|RFC 4880 section 5.5.2 Public-Key Packet Formats}
   * @param {Uint8Array} bytes - Input array to read the packet from
   * @returns {Object} This object with attributes set by the parser
   * @async
   */
  async read(bytes2, config$1 = config) {
    let pos2 = 0;
    this.version = bytes2[pos2++];
    if (this.version === 5 && !config$1.enableParsingV5Entities) {
      throw new UnsupportedError("Support for parsing v5 entities is disabled; turn on `config.enableParsingV5Entities` if needed");
    }
    if (this.version === 4 || this.version === 5 || this.version === 6) {
      this.created = util.readDate(bytes2.subarray(pos2, pos2 + 4));
      pos2 += 4;
      this.algorithm = bytes2[pos2++];
      if (this.version >= 5) {
        pos2 += 4;
      }
      const { read, publicParams } = parsePublicKeyParams(this.algorithm, bytes2.subarray(pos2));
      if (this.version === 6 && publicParams.oid && (publicParams.oid.getName() === enums.curve.curve25519Legacy || publicParams.oid.getName() === enums.curve.ed25519Legacy)) {
        throw new Error("Legacy curve25519 cannot be used with v6 keys");
      }
      this.publicParams = publicParams;
      pos2 += read;
      await this.computeFingerprintAndKeyID();
      return pos2;
    }
    throw new UnsupportedError(`Version ${this.version} of the key packet is unsupported.`);
  }
  /**
   * Creates an OpenPGP public key packet for the given key.
   * @returns {Uint8Array} Bytes encoding the public key OpenPGP packet.
   */
  write() {
    const arr = [];
    arr.push(new Uint8Array([this.version]));
    arr.push(util.writeDate(this.created));
    arr.push(new Uint8Array([this.algorithm]));
    const params = serializeParams(this.algorithm, this.publicParams);
    if (this.version >= 5) {
      arr.push(util.writeNumber(params.length, 4));
    }
    arr.push(params);
    return util.concatUint8Array(arr);
  }
  /**
   * Write packet in order to be hashed; either for a signature or a fingerprint
   * @param {Integer} version - target version of signature or key
   */
  writeForHash(version2) {
    const bytes2 = this.writePublicKey();
    const versionOctet = 149 + version2;
    const lengthOctets = version2 >= 5 ? 4 : 2;
    return util.concatUint8Array([new Uint8Array([versionOctet]), util.writeNumber(bytes2.length, lengthOctets), bytes2]);
  }
  /**
   * Check whether secret-key data is available in decrypted form. Returns null for public keys.
   * @returns {Boolean|null}
   */
  isDecrypted() {
    return null;
  }
  /**
   * Returns the creation time of the key
   * @returns {Date}
   */
  getCreationTime() {
    return this.created;
  }
  /**
   * Return the key ID of the key
   * @returns {module:type/keyid~KeyID} The 8-byte key ID
   */
  getKeyID() {
    return this.keyID;
  }
  /**
   * Computes and set the key ID and fingerprint of the key
   * @async
   */
  async computeFingerprintAndKeyID() {
    await this.computeFingerprint();
    this.keyID = new KeyID();
    if (this.version >= 5) {
      this.keyID.read(this.fingerprint.subarray(0, 8));
    } else if (this.version === 4) {
      this.keyID.read(this.fingerprint.subarray(12, 20));
    } else {
      throw new Error("Unsupported key version");
    }
  }
  /**
   * Computes and set the fingerprint of the key
   */
  async computeFingerprint() {
    const toHash = this.writeForHash(this.version);
    if (this.version >= 5) {
      this.fingerprint = await computeDigest(enums.hash.sha256, toHash);
    } else if (this.version === 4) {
      this.fingerprint = await computeDigest(enums.hash.sha1, toHash);
    } else {
      throw new Error("Unsupported key version");
    }
  }
  /**
   * Returns the fingerprint of the key, as an array of bytes
   * @returns {Uint8Array} A Uint8Array containing the fingerprint
   */
  getFingerprintBytes() {
    return this.fingerprint;
  }
  /**
   * Calculates and returns the fingerprint of the key, as a string
   * @returns {String} A string containing the fingerprint in lowercase hex
   */
  getFingerprint() {
    return util.uint8ArrayToHex(this.getFingerprintBytes());
  }
  /**
   * Calculates whether two keys have the same fingerprint without actually calculating the fingerprint
   * @returns {Boolean} Whether the two keys have the same version and public key data.
   */
  hasSameFingerprintAs(other) {
    return this.version === other.version && util.equalsUint8Array(this.writePublicKey(), other.writePublicKey());
  }
  /**
   * Returns algorithm information
   * @returns {Object} An object of the form {algorithm: String, bits:int, curve:String}.
   */
  getAlgorithmInfo() {
    const result = {};
    result.algorithm = enums.read(enums.publicKey, this.algorithm);
    const modulo = this.publicParams.n || this.publicParams.p;
    if (modulo) {
      result.bits = util.uint8ArrayBitLength(modulo);
    } else if (this.publicParams.oid) {
      result.curve = this.publicParams.oid.getName();
    }
    return result;
  }
};
PublicKeyPacket.prototype.readPublicKey = PublicKeyPacket.prototype.read;
PublicKeyPacket.prototype.writePublicKey = PublicKeyPacket.prototype.write;
var PublicSubkeyPacket = class _PublicSubkeyPacket extends PublicKeyPacket {
  static get tag() {
    return enums.packet.publicSubkey;
  }
  /**
   * @param {Date} [date] - Creation date
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(date, config2) {
    super(date, config2);
  }
  /**
   * Create a PublicSubkeyPacket from a SecretSubkeyPacket
   * @param {SecretSubkeyPacket} secretSubkeyPacket - subkey packet to convert
   * @returns {SecretSubkeyPacket} public key packet
   * @static
   */
  static fromSecretSubkeyPacket(secretSubkeyPacket) {
    const keyPacket = new _PublicSubkeyPacket();
    const { version: version2, created, algorithm, publicParams, keyID, fingerprint } = secretSubkeyPacket;
    keyPacket.version = version2;
    keyPacket.created = created;
    keyPacket.algorithm = algorithm;
    keyPacket.publicParams = publicParams;
    keyPacket.keyID = keyID;
    keyPacket.fingerprint = fingerprint;
    return keyPacket;
  }
};
var UserAttributePacket = class _UserAttributePacket {
  static get tag() {
    return enums.packet.userAttribute;
  }
  constructor() {
    this.attributes = [];
  }
  /**
   * parsing function for a user attribute packet (tag 17).
   * @param {Uint8Array} input - Payload of a tag 17 packet
   */
  read(bytes2) {
    let i = 0;
    while (i < bytes2.length) {
      const len = readSimpleLength(bytes2.subarray(i, bytes2.length));
      i += len.offset;
      this.attributes.push(util.uint8ArrayToString(bytes2.subarray(i, i + len.len)));
      i += len.len;
    }
  }
  /**
   * Creates a binary representation of the user attribute packet
   * @returns {Uint8Array} String representation.
   */
  write() {
    const arr = [];
    for (let i = 0; i < this.attributes.length; i++) {
      arr.push(writeSimpleLength(this.attributes[i].length));
      arr.push(util.stringToUint8Array(this.attributes[i]));
    }
    return util.concatUint8Array(arr);
  }
  /**
   * Compare for equality
   * @param {UserAttributePacket} usrAttr
   * @returns {Boolean} True if equal.
   */
  equals(usrAttr) {
    if (!usrAttr || !(usrAttr instanceof _UserAttributePacket)) {
      return false;
    }
    return this.attributes.every(function(attr, index2) {
      return attr === usrAttr.attributes[index2];
    });
  }
};
var SecretKeyPacket = class extends PublicKeyPacket {
  static get tag() {
    return enums.packet.secretKey;
  }
  /**
   * @param {Date} [date] - Creation date
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(date = /* @__PURE__ */ new Date(), config$1 = config) {
    super(date, config$1);
    this.keyMaterial = null;
    this.isEncrypted = null;
    this.s2kUsage = 0;
    this.s2k = null;
    this.symmetric = null;
    this.aead = null;
    this.isLegacyAEAD = null;
    this.privateParams = null;
    this.usedModernAEAD = null;
  }
  // 5.5.3.  Secret-Key Packet Formats
  /**
   * Internal parser for private keys as specified in
   * {@link https://tools.ietf.org/html/draft-ietf-openpgp-rfc4880bis-04#section-5.5.3|RFC4880bis-04 section 5.5.3}
   * @param {Uint8Array} bytes - Input string to read the packet from
   * @async
   */
  async read(bytes2, config$1 = config) {
    let i = await this.readPublicKey(bytes2, config$1);
    const startOfSecretKeyData = i;
    this.s2kUsage = bytes2[i++];
    if (this.version === 5) {
      i++;
    }
    if (this.version === 6 && this.s2kUsage) {
      i++;
    }
    try {
      if (this.s2kUsage === 255 || this.s2kUsage === 254 || this.s2kUsage === 253) {
        this.symmetric = bytes2[i++];
        if (this.s2kUsage === 253) {
          this.aead = bytes2[i++];
        }
        if (this.version === 6) {
          i++;
        }
        const s2kType = bytes2[i++];
        this.s2k = newS2KFromType(s2kType);
        i += this.s2k.read(bytes2.subarray(i, bytes2.length));
        if (this.s2k.type === "gnu-dummy") {
          return;
        }
      } else if (this.s2kUsage) {
        this.symmetric = this.s2kUsage;
      }
      if (this.s2kUsage) {
        this.isLegacyAEAD = this.s2kUsage === 253 && (this.version === 5 || this.version === 4 && config$1.parseAEADEncryptedV4KeysAsLegacy);
        if (this.s2kUsage !== 253 || this.isLegacyAEAD) {
          this.iv = bytes2.subarray(
            i,
            i + getCipherParams(this.symmetric).blockSize
          );
          this.usedModernAEAD = false;
        } else {
          this.iv = bytes2.subarray(
            i,
            i + getAEADMode(this.aead).ivLength
          );
          this.usedModernAEAD = true;
        }
        i += this.iv.length;
      }
    } catch (e) {
      if (!this.s2kUsage) throw e;
      this.unparseableKeyMaterial = bytes2.subarray(startOfSecretKeyData);
      this.isEncrypted = true;
    }
    if (this.version === 5) {
      i += 4;
    }
    this.keyMaterial = bytes2.subarray(i);
    this.isEncrypted = !!this.s2kUsage;
    if (!this.isEncrypted) {
      let cleartext;
      if (this.version === 6) {
        cleartext = this.keyMaterial;
      } else {
        cleartext = this.keyMaterial.subarray(0, -2);
        if (!util.equalsUint8Array(util.writeChecksum(cleartext), this.keyMaterial.subarray(-2))) {
          throw new Error("Key checksum mismatch");
        }
      }
      try {
        const { read, privateParams } = parsePrivateKeyParams(this.algorithm, cleartext, this.publicParams);
        if (read < cleartext.length) {
          throw new Error("Error reading MPIs");
        }
        this.privateParams = privateParams;
      } catch (err2) {
        if (err2 instanceof UnsupportedError) throw err2;
        throw new Error("Error reading MPIs");
      }
    }
  }
  /**
   * Creates an OpenPGP key packet for the given key.
   * @returns {Uint8Array} A string of bytes containing the secret key OpenPGP packet.
   */
  write() {
    const serializedPublicKey = this.writePublicKey();
    if (this.unparseableKeyMaterial) {
      return util.concatUint8Array([
        serializedPublicKey,
        this.unparseableKeyMaterial
      ]);
    }
    const arr = [serializedPublicKey];
    arr.push(new Uint8Array([this.s2kUsage]));
    const optionalFieldsArr = [];
    if (this.s2kUsage === 255 || this.s2kUsage === 254 || this.s2kUsage === 253) {
      optionalFieldsArr.push(this.symmetric);
      if (this.s2kUsage === 253) {
        optionalFieldsArr.push(this.aead);
      }
      const s2k = this.s2k.write();
      if (this.version === 6) {
        optionalFieldsArr.push(s2k.length);
      }
      optionalFieldsArr.push(...s2k);
    }
    if (this.s2kUsage && this.s2k.type !== "gnu-dummy") {
      optionalFieldsArr.push(...this.iv);
    }
    if (this.version === 5 || this.version === 6 && this.s2kUsage) {
      arr.push(new Uint8Array([optionalFieldsArr.length]));
    }
    arr.push(new Uint8Array(optionalFieldsArr));
    if (!this.isDummy()) {
      if (!this.s2kUsage) {
        this.keyMaterial = serializeParams(this.algorithm, this.privateParams);
      }
      if (this.version === 5) {
        arr.push(util.writeNumber(this.keyMaterial.length, 4));
      }
      arr.push(this.keyMaterial);
      if (!this.s2kUsage && this.version !== 6) {
        arr.push(util.writeChecksum(this.keyMaterial));
      }
    }
    return util.concatUint8Array(arr);
  }
  /**
   * Check whether secret-key data is available in decrypted form.
   * Returns false for gnu-dummy keys and null for public keys.
   * @returns {Boolean|null}
   */
  isDecrypted() {
    return this.isEncrypted === false;
  }
  /**
   * Check whether the key includes secret key material.
   * Some secret keys do not include it, and can thus only be used
   * for public-key operations (encryption and verification).
   * Such keys are:
   * - GNU-dummy keys, where the secret material has been stripped away
   * - encrypted keys with unsupported S2K or cipher
   */
  isMissingSecretKeyMaterial() {
    return this.unparseableKeyMaterial !== void 0 || this.isDummy();
  }
  /**
   * Check whether this is a gnu-dummy key
   * @returns {Boolean}
   */
  isDummy() {
    return !!(this.s2k && this.s2k.type === "gnu-dummy");
  }
  /**
   * Remove private key material, converting the key to a dummy one.
   * The resulting key cannot be used for signing/decrypting but can still verify signatures.
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  makeDummy(config$1 = config) {
    if (this.isDummy()) {
      return;
    }
    if (this.isDecrypted()) {
      this.clearPrivateParams();
    }
    delete this.unparseableKeyMaterial;
    this.isEncrypted = null;
    this.keyMaterial = null;
    this.s2k = newS2KFromType(enums.s2k.gnu, config$1);
    this.s2k.algorithm = 0;
    this.s2k.c = 0;
    this.s2k.type = "gnu-dummy";
    this.s2kUsage = 254;
    this.symmetric = enums.symmetric.aes256;
    this.isLegacyAEAD = null;
    this.usedModernAEAD = null;
  }
  /**
   * Encrypt the payload. By default, we use aes256 and iterated, salted string
   * to key specifier. If the key is in a decrypted state (isEncrypted === false)
   * and the passphrase is empty or undefined, the key will be set as not encrypted.
   * This can be used to remove passphrase protection after calling decrypt().
   * @param {String} passphrase
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @throws {Error} if encryption was not successful
   * @async
   */
  async encrypt(passphrase, config$1 = config) {
    if (this.isDummy()) {
      return;
    }
    if (!this.isDecrypted()) {
      throw new Error("Key packet is already encrypted");
    }
    if (!passphrase) {
      throw new Error("A non-empty passphrase is required for key encryption.");
    }
    this.s2k = newS2KFromConfig(config$1);
    this.s2k.generateSalt();
    const cleartext = serializeParams(this.algorithm, this.privateParams);
    this.symmetric = enums.symmetric.aes256;
    const { blockSize } = getCipherParams(this.symmetric);
    if (config$1.aeadProtect) {
      this.s2kUsage = 253;
      this.aead = config$1.preferredAEADAlgorithm;
      const mode = getAEADMode(this.aead);
      this.isLegacyAEAD = this.version === 5;
      this.usedModernAEAD = !this.isLegacyAEAD;
      const serializedPacketTag = writeTag(this.constructor.tag);
      const key = await produceEncryptionKey(this.version, this.s2k, passphrase, this.symmetric, this.aead, serializedPacketTag, this.isLegacyAEAD);
      const modeInstance = await mode(this.symmetric, key);
      this.iv = this.isLegacyAEAD ? getRandomBytes(blockSize) : getRandomBytes(mode.ivLength);
      const associateData = this.isLegacyAEAD ? new Uint8Array() : util.concatUint8Array([serializedPacketTag, this.writePublicKey()]);
      this.keyMaterial = await modeInstance.encrypt(cleartext, this.iv.subarray(0, mode.ivLength), associateData);
    } else {
      this.s2kUsage = 254;
      this.usedModernAEAD = false;
      const key = await produceEncryptionKey(this.version, this.s2k, passphrase, this.symmetric);
      this.iv = getRandomBytes(blockSize);
      this.keyMaterial = await encrypt$1(this.symmetric, key, util.concatUint8Array([
        cleartext,
        await computeDigest(enums.hash.sha1, cleartext)
      ]), this.iv);
    }
  }
  /**
   * Decrypts the private key params which are needed to use the key.
   * Successful decryption does not imply key integrity, call validate() to confirm that.
   * {@link SecretKeyPacket.isDecrypted} should be false, as
   * otherwise calls to this function will throw an error.
   * @param {String} passphrase - The passphrase for this private key as string
   * @throws {Error} if the key is already decrypted, or if decryption was not successful
   * @async
   */
  async decrypt(passphrase) {
    if (this.isDummy()) {
      return false;
    }
    if (this.unparseableKeyMaterial) {
      throw new Error("Key packet cannot be decrypted: unsupported S2K or cipher algo");
    }
    if (this.isDecrypted()) {
      throw new Error("Key packet is already decrypted.");
    }
    let key;
    const serializedPacketTag = writeTag(this.constructor.tag);
    if (this.s2kUsage === 254 || this.s2kUsage === 253) {
      key = await produceEncryptionKey(
        this.version,
        this.s2k,
        passphrase,
        this.symmetric,
        this.aead,
        serializedPacketTag,
        this.isLegacyAEAD
      );
    } else if (this.s2kUsage === 255) {
      throw new Error("Encrypted private key is authenticated using an insecure two-byte hash");
    } else {
      throw new Error("Private key is encrypted using an insecure S2K function: unsalted MD5");
    }
    let cleartext;
    if (this.s2kUsage === 253) {
      const mode = getAEADMode(this.aead, true);
      const modeInstance = await mode(this.symmetric, key);
      try {
        const associateData = this.isLegacyAEAD ? new Uint8Array() : util.concatUint8Array([serializedPacketTag, this.writePublicKey()]);
        cleartext = await modeInstance.decrypt(this.keyMaterial, this.iv.subarray(0, mode.ivLength), associateData);
      } catch (err2) {
        if (err2.message === "Authentication tag mismatch") {
          throw new Error("Incorrect key passphrase: " + err2.message);
        }
        throw err2;
      }
    } else {
      const cleartextWithHash = await decrypt$1(this.symmetric, key, this.keyMaterial, this.iv);
      cleartext = cleartextWithHash.subarray(0, -20);
      const hash2 = await computeDigest(enums.hash.sha1, cleartext);
      if (!util.equalsUint8Array(hash2, cleartextWithHash.subarray(-20))) {
        throw new Error("Incorrect key passphrase");
      }
    }
    try {
      const { privateParams } = parsePrivateKeyParams(this.algorithm, cleartext, this.publicParams);
      this.privateParams = privateParams;
    } catch (err2) {
      throw new Error("Error reading MPIs");
    }
    this.isEncrypted = false;
    this.keyMaterial = null;
    this.s2kUsage = 0;
    this.aead = null;
    this.symmetric = null;
    this.isLegacyAEAD = null;
  }
  /**
   * Checks that the key parameters are consistent
   * @throws {Error} if validation was not successful
   * @async
   */
  async validate() {
    if (this.isDummy()) {
      return;
    }
    if (!this.isDecrypted()) {
      throw new Error("Key is not decrypted");
    }
    if (this.usedModernAEAD) {
      return;
    }
    let validParams;
    try {
      validParams = await validateParams$1(this.algorithm, this.publicParams, this.privateParams);
    } catch (_) {
      validParams = false;
    }
    if (!validParams) {
      throw new Error("Key is invalid");
    }
  }
  async generate(bits2, curve) {
    if (this.version === 6 && (this.algorithm === enums.publicKey.ecdh && curve === enums.curve.curve25519Legacy || this.algorithm === enums.publicKey.eddsaLegacy)) {
      throw new Error(`Cannot generate v6 keys of type 'ecc' with curve ${curve}. Generate a key of type 'curve25519' instead`);
    }
    const { privateParams, publicParams } = await generateParams(this.algorithm, bits2, curve);
    this.privateParams = privateParams;
    this.publicParams = publicParams;
    this.isEncrypted = false;
  }
  /**
   * Clear private key parameters
   */
  clearPrivateParams() {
    if (this.isMissingSecretKeyMaterial()) {
      return;
    }
    Object.keys(this.privateParams).forEach((name2) => {
      const param = this.privateParams[name2];
      param.fill(0);
      delete this.privateParams[name2];
    });
    this.privateParams = null;
    this.isEncrypted = true;
  }
};
async function produceEncryptionKey(keyVersion, s2k, passphrase, cipherAlgo, aeadMode, serializedPacketTag, isLegacyAEAD) {
  if (s2k.type === "argon2" && !aeadMode) {
    throw new Error("Using Argon2 S2K without AEAD is not allowed");
  }
  if (s2k.type === "simple" && keyVersion === 6) {
    throw new Error("Using Simple S2K with version 6 keys is not allowed");
  }
  const { keySize } = getCipherParams(cipherAlgo);
  const derivedKey = await s2k.produceKey(passphrase, keySize);
  if (!aeadMode || keyVersion === 5 || isLegacyAEAD) {
    return derivedKey;
  }
  const info = util.concatUint8Array([
    serializedPacketTag,
    new Uint8Array([keyVersion, cipherAlgo, aeadMode])
  ]);
  return computeHKDF(enums.hash.sha256, derivedKey, new Uint8Array(), info, keySize);
}
var UserIDPacket = class _UserIDPacket {
  static get tag() {
    return enums.packet.userID;
  }
  constructor() {
    this.userID = "";
    this.name = "";
    this.email = "";
    this.comment = "";
  }
  /**
   * Create UserIDPacket instance from object
   * @param {Object} userID - Object specifying userID name, email and comment
   * @returns {UserIDPacket}
   * @static
   */
  static fromObject(userID) {
    if (util.isString(userID) || userID.name && !util.isString(userID.name) || userID.email && !util.isEmailAddress(userID.email) || userID.comment && !util.isString(userID.comment)) {
      throw new Error("Invalid user ID format");
    }
    const packet = new _UserIDPacket();
    Object.assign(packet, userID);
    const components = [];
    if (packet.name) components.push(packet.name);
    if (packet.comment) components.push(`(${packet.comment})`);
    if (packet.email) components.push(`<${packet.email}>`);
    packet.userID = components.join(" ");
    return packet;
  }
  /**
   * Parsing function for a user id packet (tag 13).
   * @param {Uint8Array} input - Payload of a tag 13 packet
   */
  read(bytes2, config$1 = config) {
    const userID = util.decodeUTF8(bytes2);
    if (userID.length > config$1.maxUserIDLength) {
      throw new Error("User ID string is too long");
    }
    const re = /^(?<name>[^()]+\s+)?(?<comment>\([^()]+\)\s+)?(?<email><\S+@\S+>)$/;
    const matches = re.exec(userID);
    if (matches !== null) {
      const { name: name2, comment, email } = matches.groups;
      this.comment = comment?.replace(/^\(|\)|\s$/g, "").trim() || "";
      this.name = name2?.trim() || "";
      this.email = email.substring(1, email.length - 1);
    } else if (/^[^\s@]+@[^\s@]+$/.test(userID)) {
      this.email = userID;
    }
    this.userID = userID;
  }
  /**
   * Creates a binary representation of the user id packet
   * @returns {Uint8Array} Binary representation.
   */
  write() {
    return util.encodeUTF8(this.userID);
  }
  equals(otherUserID) {
    return otherUserID && otherUserID.userID === this.userID;
  }
};
var SecretSubkeyPacket = class extends SecretKeyPacket {
  static get tag() {
    return enums.packet.secretSubkey;
  }
  /**
   * @param {Date} [date] - Creation date
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(date = /* @__PURE__ */ new Date(), config$1 = config) {
    super(date, config$1);
  }
};
var allowedPackets$1 = /* @__PURE__ */ util.constructAllowedPackets([SignaturePacket]);
var Signature = class {
  /**
   * @param {PacketList} packetlist - The signature packets
   */
  constructor(packetlist) {
    this.packets = packetlist || new PacketList();
  }
  /**
   * Returns binary encoded signature
   * @returns {ReadableStream<Uint8Array>} Binary signature.
   */
  write() {
    return this.packets.write();
  }
  /**
   * Returns ASCII armored text of signature
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {ReadableStream<String>} ASCII armor.
   */
  armor(config$1 = config) {
    const emitChecksum = this.packets.some((packet) => packet.constructor.tag === SignaturePacket.tag && packet.version !== 6);
    return armor(enums.armor.signature, this.write(), void 0, void 0, void 0, emitChecksum, config$1);
  }
  /**
   * Returns an array of KeyIDs of all of the issuers who created this signature
   * @returns {Array<KeyID>} The Key IDs of the signing keys
   */
  getSigningKeyIDs() {
    return this.packets.map((packet) => packet.issuerKeyID);
  }
};
async function readSignature({ armoredSignature, binarySignature, config: config$1, ...rest }) {
  config$1 = { ...config, ...config$1 };
  let input = armoredSignature || binarySignature;
  if (!input) {
    throw new Error("readSignature: must pass options object containing `armoredSignature` or `binarySignature`");
  }
  if (armoredSignature && !util.isString(armoredSignature)) {
    throw new Error("readSignature: options.armoredSignature must be a string");
  }
  if (binarySignature && !util.isUint8Array(binarySignature)) {
    throw new Error("readSignature: options.binarySignature must be a Uint8Array");
  }
  const unknownOptions = Object.keys(rest);
  if (unknownOptions.length > 0) throw new Error(`Unknown option: ${unknownOptions.join(", ")}`);
  if (armoredSignature) {
    const { type, data } = await unarmor(input);
    if (type !== enums.armor.signature) {
      throw new Error("Armored text not of type signature");
    }
    input = data;
  }
  const packetlist = await PacketList.fromBinary(input, allowedPackets$1, config$1);
  return new Signature(packetlist);
}
async function generateSecretSubkey(options, config2) {
  const secretSubkeyPacket = new SecretSubkeyPacket(options.date, config2);
  secretSubkeyPacket.packets = null;
  secretSubkeyPacket.algorithm = enums.write(enums.publicKey, options.algorithm);
  await secretSubkeyPacket.generate(options.rsaBits, options.curve);
  await secretSubkeyPacket.computeFingerprintAndKeyID();
  return secretSubkeyPacket;
}
async function getLatestValidSignature(signatures, publicKey, signatureType, dataToVerify, date = /* @__PURE__ */ new Date(), config2) {
  let latestValid;
  let exception;
  for (let i = signatures.length - 1; i >= 0; i--) {
    try {
      if (!latestValid || signatures[i].created >= latestValid.created) {
        await signatures[i].verify(publicKey, signatureType, dataToVerify, date, void 0, config2);
        latestValid = signatures[i];
      }
    } catch (e) {
      exception = e;
    }
  }
  if (!latestValid) {
    throw util.wrapError(
      `Could not find valid ${enums.read(enums.signature, signatureType)} signature in key ${publicKey.getKeyID().toHex()}`.replace("certGeneric ", "self-").replace(/([a-z])([A-Z])/g, (_, $1, $2) => $1 + " " + $2.toLowerCase()),
      exception
    );
  }
  return latestValid;
}
function isDataExpired(keyPacket, signature, date = /* @__PURE__ */ new Date()) {
  const normDate = util.normalizeDate(date);
  if (normDate !== null) {
    const expirationTime = getKeyExpirationTime(keyPacket, signature);
    return !(keyPacket.created <= normDate && normDate < expirationTime);
  }
  return false;
}
async function createBindingSignature(subkey, primaryKey, options, config2) {
  const dataToSign = {};
  dataToSign.key = primaryKey;
  dataToSign.bind = subkey;
  const signatureProperties = { signatureType: enums.signature.subkeyBinding };
  if (options.sign) {
    signatureProperties.keyFlags = [enums.keyFlags.signData];
    signatureProperties.embeddedSignature = await createSignaturePacket(dataToSign, [], subkey, {
      signatureType: enums.signature.keyBinding
    }, options.date, void 0, void 0, void 0, config2);
  } else {
    signatureProperties.keyFlags = [enums.keyFlags.encryptCommunication | enums.keyFlags.encryptStorage];
  }
  if (options.keyExpirationTime > 0) {
    signatureProperties.keyExpirationTime = options.keyExpirationTime;
    signatureProperties.keyNeverExpires = false;
  }
  const subkeySignaturePacket = await createSignaturePacket(dataToSign, [], primaryKey, signatureProperties, options.date, void 0, void 0, void 0, config2);
  return subkeySignaturePacket;
}
async function getPreferredHashAlgo(targetKeys, signingKeyPacket, date = /* @__PURE__ */ new Date(), targetUserIDs = [], config2) {
  const defaultAlgo = enums.hash.sha256;
  const preferredSenderAlgo = config2.preferredHashAlgorithm;
  const supportedAlgosPerTarget = await Promise.all(targetKeys.map(async (key, i) => {
    const selfCertification = await key.getPrimarySelfSignature(date, targetUserIDs[i], config2);
    const targetPrefs = selfCertification.preferredHashAlgorithms;
    return targetPrefs || [];
  }));
  const supportedAlgosMap = /* @__PURE__ */ new Map();
  for (const supportedAlgos of supportedAlgosPerTarget) {
    for (const hashAlgo of supportedAlgos) {
      try {
        const supportedAlgo = enums.write(enums.hash, hashAlgo);
        supportedAlgosMap.set(
          supportedAlgo,
          supportedAlgosMap.has(supportedAlgo) ? supportedAlgosMap.get(supportedAlgo) + 1 : 1
        );
      } catch {
      }
    }
  }
  const isSupportedHashAlgo = (hashAlgo) => targetKeys.length === 0 || supportedAlgosMap.get(hashAlgo) === targetKeys.length || hashAlgo === defaultAlgo;
  const getStrongestSupportedHashAlgo = () => {
    if (supportedAlgosMap.size === 0) {
      return defaultAlgo;
    }
    const sortedHashAlgos = Array.from(supportedAlgosMap.keys()).filter((hashAlgo) => isSupportedHashAlgo(hashAlgo)).sort((algoA, algoB) => getHashByteLength(algoA) - getHashByteLength(algoB));
    const strongestHashAlgo = sortedHashAlgos[0];
    return getHashByteLength(strongestHashAlgo) >= getHashByteLength(defaultAlgo) ? strongestHashAlgo : defaultAlgo;
  };
  const eccAlgos = /* @__PURE__ */ new Set([
    enums.publicKey.ecdsa,
    enums.publicKey.eddsaLegacy,
    enums.publicKey.ed25519,
    enums.publicKey.ed448
  ]);
  if (eccAlgos.has(signingKeyPacket.algorithm)) {
    const preferredCurveAlgo = getPreferredCurveHashAlgo(signingKeyPacket.algorithm, signingKeyPacket.publicParams.oid);
    const preferredSenderAlgoIsSupported = isSupportedHashAlgo(preferredSenderAlgo);
    const preferredSenderAlgoStrongerThanCurveAlgo = getHashByteLength(preferredSenderAlgo) >= getHashByteLength(preferredCurveAlgo);
    if (preferredSenderAlgoIsSupported && preferredSenderAlgoStrongerThanCurveAlgo) {
      return preferredSenderAlgo;
    } else {
      const strongestSupportedAlgo = getStrongestSupportedHashAlgo();
      return getHashByteLength(strongestSupportedAlgo) >= getHashByteLength(preferredCurveAlgo) ? strongestSupportedAlgo : preferredCurveAlgo;
    }
  }
  return isSupportedHashAlgo(preferredSenderAlgo) ? preferredSenderAlgo : getStrongestSupportedHashAlgo();
}
async function getPreferredCipherSuite(keys = [], date = /* @__PURE__ */ new Date(), userIDs = [], config$1 = config) {
  const selfSigs = await Promise.all(keys.map((key, i) => key.getPrimarySelfSignature(date, userIDs[i], config$1)));
  const withAEAD = keys.length ? selfSigs.every((selfSig) => selfSig.features && selfSig.features[0] & enums.features.seipdv2) : config$1.aeadProtect;
  if (withAEAD) {
    const defaultCipherSuite = { symmetricAlgo: enums.symmetric.aes128, aeadAlgo: enums.aead.ocb };
    const desiredCipherSuites = [
      { symmetricAlgo: config$1.preferredSymmetricAlgorithm, aeadAlgo: config$1.preferredAEADAlgorithm },
      { symmetricAlgo: config$1.preferredSymmetricAlgorithm, aeadAlgo: enums.aead.ocb },
      { symmetricAlgo: enums.symmetric.aes128, aeadAlgo: config$1.preferredAEADAlgorithm }
    ];
    for (const desiredCipherSuite of desiredCipherSuites) {
      if (selfSigs.every((selfSig) => selfSig.preferredCipherSuites && selfSig.preferredCipherSuites.some(
        (cipherSuite) => cipherSuite[0] === desiredCipherSuite.symmetricAlgo && cipherSuite[1] === desiredCipherSuite.aeadAlgo
      ))) {
        return desiredCipherSuite;
      }
    }
    return defaultCipherSuite;
  }
  const defaultSymAlgo = enums.symmetric.aes128;
  const desiredSymAlgo = config$1.preferredSymmetricAlgorithm;
  return {
    symmetricAlgo: selfSigs.every((selfSig) => selfSig.preferredSymmetricAlgorithms && selfSig.preferredSymmetricAlgorithms.includes(desiredSymAlgo)) ? desiredSymAlgo : defaultSymAlgo,
    aeadAlgo: void 0
  };
}
async function createSignaturePacket(dataToSign, recipientKeys, signingKeyPacket, signatureProperties, date, recipientUserIDs, notations = [], detached = false, config2) {
  if (signingKeyPacket.isDummy()) {
    throw new Error("Cannot sign with a gnu-dummy key.");
  }
  if (!signingKeyPacket.isDecrypted()) {
    throw new Error("Signing key is not decrypted.");
  }
  const signaturePacket = new SignaturePacket();
  Object.assign(signaturePacket, signatureProperties);
  signaturePacket.publicKeyAlgorithm = signingKeyPacket.algorithm;
  signaturePacket.hashAlgorithm = await getPreferredHashAlgo(recipientKeys, signingKeyPacket, date, recipientUserIDs, config2);
  signaturePacket.rawNotations = [...notations];
  await signaturePacket.sign(signingKeyPacket, dataToSign, date, detached, config2);
  return signaturePacket;
}
async function mergeSignatures(source, dest, attr, date = /* @__PURE__ */ new Date(), checkFn) {
  source = source[attr];
  if (source) {
    if (!dest[attr].length) {
      dest[attr] = source;
    } else {
      await Promise.all(source.map(async function(sourceSig) {
        if (!sourceSig.isExpired(date) && (!checkFn || await checkFn(sourceSig)) && !dest[attr].some(function(destSig) {
          return util.equalsUint8Array(destSig.writeParams(), sourceSig.writeParams());
        })) {
          dest[attr].push(sourceSig);
        }
      }));
    }
  }
}
async function isDataRevoked(primaryKey, signatureType, dataToVerify, revocations, signature, key, date = /* @__PURE__ */ new Date(), config2) {
  key = key || primaryKey;
  const revocationKeyIDs = [];
  await Promise.all(revocations.map(async function(revocationSignature) {
    try {
      if (
        // Note: a third-party revocation signature could legitimately revoke a
        // self-signature if the signature has an authorized revocation key.
        // However, we don't support passing authorized revocation keys, nor
        // verifying such revocation signatures. Instead, we indicate an error
        // when parsing a key with an authorized revocation key, and ignore
        // third-party revocation signatures here. (It could also be revoking a
        // third-party key certification, which should only affect
        // `verifyAllCertifications`.)
        !signature || revocationSignature.issuerKeyID.equals(signature.issuerKeyID)
      ) {
        const isHardRevocation = ![
          enums.reasonForRevocation.keyRetired,
          enums.reasonForRevocation.keySuperseded,
          enums.reasonForRevocation.userIDInvalid
        ].includes(revocationSignature.reasonForRevocationFlag);
        await revocationSignature.verify(
          key,
          signatureType,
          dataToVerify,
          isHardRevocation ? null : date,
          false,
          config2
        );
        revocationKeyIDs.push(revocationSignature.issuerKeyID);
      }
    } catch (e) {
    }
  }));
  if (signature) {
    signature.revoked = revocationKeyIDs.some((keyID) => keyID.equals(signature.issuerKeyID)) ? true : signature.revoked || false;
    return signature.revoked;
  }
  return revocationKeyIDs.length > 0;
}
function getKeyExpirationTime(keyPacket, signature) {
  let expirationTime;
  if (signature.keyNeverExpires === false) {
    expirationTime = keyPacket.created.getTime() + signature.keyExpirationTime * 1e3;
  }
  return expirationTime ? new Date(expirationTime) : Infinity;
}
function sanitizeKeyOptions(options, subkeyDefaults = {}) {
  options.type = options.type || subkeyDefaults.type;
  options.curve = options.curve || subkeyDefaults.curve;
  options.rsaBits = options.rsaBits || subkeyDefaults.rsaBits;
  options.keyExpirationTime = options.keyExpirationTime !== void 0 ? options.keyExpirationTime : subkeyDefaults.keyExpirationTime;
  options.passphrase = util.isString(options.passphrase) ? options.passphrase : subkeyDefaults.passphrase;
  options.date = options.date || subkeyDefaults.date;
  options.sign = options.sign || false;
  switch (options.type) {
    case "ecc":
      try {
        options.curve = enums.write(enums.curve, options.curve);
      } catch (e) {
        throw new Error("Unknown curve");
      }
      if (options.curve === enums.curve.ed25519Legacy || options.curve === enums.curve.curve25519Legacy || options.curve === "ed25519" || options.curve === "curve25519") {
        options.curve = options.sign ? enums.curve.ed25519Legacy : enums.curve.curve25519Legacy;
      }
      if (options.sign) {
        options.algorithm = options.curve === enums.curve.ed25519Legacy ? enums.publicKey.eddsaLegacy : enums.publicKey.ecdsa;
      } else {
        options.algorithm = enums.publicKey.ecdh;
      }
      break;
    case "curve25519":
      options.algorithm = options.sign ? enums.publicKey.ed25519 : enums.publicKey.x25519;
      break;
    case "curve448":
      options.algorithm = options.sign ? enums.publicKey.ed448 : enums.publicKey.x448;
      break;
    case "rsa":
      options.algorithm = enums.publicKey.rsaEncryptSign;
      break;
    default:
      throw new Error(`Unsupported key type ${options.type}`);
  }
  return options;
}
function validateSigningKeyPacket(keyPacket, signature, config2) {
  switch (keyPacket.algorithm) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign:
    case enums.publicKey.dsa:
    case enums.publicKey.ecdsa:
    case enums.publicKey.eddsaLegacy:
    case enums.publicKey.ed25519:
    case enums.publicKey.ed448:
      if (!signature.keyFlags && !config2.allowMissingKeyFlags) {
        throw new Error("None of the key flags is set: consider passing `config.allowMissingKeyFlags`");
      }
      return !signature.keyFlags || (signature.keyFlags[0] & enums.keyFlags.signData) !== 0;
    default:
      return false;
  }
}
function validateEncryptionKeyPacket(keyPacket, signature, config2) {
  switch (keyPacket.algorithm) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.elgamal:
    case enums.publicKey.ecdh:
    case enums.publicKey.x25519:
    case enums.publicKey.x448:
      if (!signature.keyFlags && !config2.allowMissingKeyFlags) {
        throw new Error("None of the key flags is set: consider passing `config.allowMissingKeyFlags`");
      }
      return !signature.keyFlags || (signature.keyFlags[0] & enums.keyFlags.encryptCommunication) !== 0 || (signature.keyFlags[0] & enums.keyFlags.encryptStorage) !== 0;
    default:
      return false;
  }
}
function validateDecryptionKeyPacket(keyPacket, signature, config2) {
  if (!signature.keyFlags && !config2.allowMissingKeyFlags) {
    throw new Error("None of the key flags is set: consider passing `config.allowMissingKeyFlags`");
  }
  switch (keyPacket.algorithm) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.elgamal:
    case enums.publicKey.ecdh:
    case enums.publicKey.x25519:
    case enums.publicKey.x448: {
      const isValidSigningKeyPacket = !signature.keyFlags || (signature.keyFlags[0] & enums.keyFlags.signData) !== 0;
      if (isValidSigningKeyPacket && config2.allowInsecureDecryptionWithSigningKeys) {
        return true;
      }
      return !signature.keyFlags || (signature.keyFlags[0] & enums.keyFlags.encryptCommunication) !== 0 || (signature.keyFlags[0] & enums.keyFlags.encryptStorage) !== 0;
    }
    default:
      return false;
  }
}
function checkKeyRequirements(keyPacket, config2) {
  const keyAlgo = enums.write(enums.publicKey, keyPacket.algorithm);
  const algoInfo = keyPacket.getAlgorithmInfo();
  if (config2.rejectPublicKeyAlgorithms.has(keyAlgo)) {
    throw new Error(`${algoInfo.algorithm} keys are considered too weak.`);
  }
  switch (keyAlgo) {
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign:
    case enums.publicKey.rsaEncrypt:
      if (algoInfo.bits < config2.minRSABits) {
        throw new Error(`RSA keys shorter than ${config2.minRSABits} bits are considered too weak.`);
      }
      break;
    case enums.publicKey.ecdsa:
    case enums.publicKey.eddsaLegacy:
    case enums.publicKey.ecdh:
      if (config2.rejectCurves.has(algoInfo.curve)) {
        throw new Error(`Support for ${algoInfo.algorithm} keys using curve ${algoInfo.curve} is disabled.`);
      }
      break;
  }
}
var User = class _User {
  constructor(userPacket, mainKey) {
    this.userID = userPacket.constructor.tag === enums.packet.userID ? userPacket : null;
    this.userAttribute = userPacket.constructor.tag === enums.packet.userAttribute ? userPacket : null;
    this.selfCertifications = [];
    this.otherCertifications = [];
    this.revocationSignatures = [];
    this.mainKey = mainKey;
  }
  /**
   * Transforms structured user data to packetlist
   * @returns {PacketList}
   */
  toPacketList() {
    const packetlist = new PacketList();
    packetlist.push(this.userID || this.userAttribute);
    packetlist.push(...this.revocationSignatures);
    packetlist.push(...this.selfCertifications);
    packetlist.push(...this.otherCertifications);
    return packetlist;
  }
  /**
   * Shallow clone
   * @returns {User}
   */
  clone() {
    const user = new _User(this.userID || this.userAttribute, this.mainKey);
    user.selfCertifications = [...this.selfCertifications];
    user.otherCertifications = [...this.otherCertifications];
    user.revocationSignatures = [...this.revocationSignatures];
    return user;
  }
  /**
   * Generate third-party certifications over this user and its primary key
   * @param {Array<PrivateKey>} signingKeys - Decrypted private keys for signing
   * @param {Date} [date] - Date to use as creation date of the certificate, instead of the current time
   * @param {Object} config - Full configuration
   * @returns {Promise<User>} New user with new certifications.
   * @async
   */
  async certify(signingKeys, date, config2) {
    const primaryKey = this.mainKey.keyPacket;
    const dataToSign = {
      userID: this.userID,
      userAttribute: this.userAttribute,
      key: primaryKey
    };
    const user = new _User(dataToSign.userID || dataToSign.userAttribute, this.mainKey);
    user.otherCertifications = await Promise.all(signingKeys.map(async function(privateKey) {
      if (!privateKey.isPrivate()) {
        throw new Error("Need private key for signing");
      }
      if (privateKey.hasSameFingerprintAs(primaryKey)) {
        throw new Error("The user's own key can only be used for self-certifications");
      }
      const signingKey = await privateKey.getSigningKey(void 0, date, void 0, config2);
      return createSignaturePacket(dataToSign, [privateKey], signingKey.keyPacket, {
        // Most OpenPGP implementations use generic certification (0x10)
        signatureType: enums.signature.certGeneric,
        keyFlags: [enums.keyFlags.certifyKeys | enums.keyFlags.signData]
      }, date, void 0, void 0, void 0, config2);
    }));
    await user.update(this, date, config2);
    return user;
  }
  /**
   * Checks if a given certificate of the user is revoked
   * @param {SignaturePacket} certificate - The certificate to verify
   * @param  {PublicSubkeyPacket|
   *          SecretSubkeyPacket|
   *          PublicKeyPacket|
   *          SecretKeyPacket} [keyPacket] The key packet to verify the signature, instead of the primary key
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} config - Full configuration
   * @returns {Promise<Boolean>} True if the certificate is revoked.
   * @async
   */
  async isRevoked(certificate, keyPacket, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const primaryKey = this.mainKey.keyPacket;
    return isDataRevoked(primaryKey, enums.signature.certRevocation, {
      key: primaryKey,
      userID: this.userID,
      userAttribute: this.userAttribute
    }, this.revocationSignatures, certificate, keyPacket, date, config$1);
  }
  /**
   * Verifies the user certificate.
   * @param {SignaturePacket} certificate - A certificate of this user
   * @param {Array<PublicKey>} verificationKeys - Array of keys to verify certificate signatures
   * @param {Date} [date] - Use the given date instead of the current time
   * @param {Object} config - Full configuration
   * @returns {Promise<true|null>} true if the certificate could be verified, or null if the verification keys do not correspond to the certificate
   * @throws if the user certificate is invalid.
   * @async
   */
  async verifyCertificate(certificate, verificationKeys, date = /* @__PURE__ */ new Date(), config2) {
    const that = this;
    const primaryKey = this.mainKey.keyPacket;
    const dataToVerify = {
      userID: this.userID,
      userAttribute: this.userAttribute,
      key: primaryKey
    };
    const { issuerKeyID } = certificate;
    const issuerKeys = verificationKeys.filter((key) => key.getKeys(issuerKeyID).length > 0);
    if (issuerKeys.length === 0) {
      return null;
    }
    await Promise.all(issuerKeys.map(async (key) => {
      const signingKey = await key.getSigningKey(issuerKeyID, certificate.created, void 0, config2);
      if (certificate.revoked || await that.isRevoked(certificate, signingKey.keyPacket, date, config2)) {
        throw new Error("User certificate is revoked");
      }
      try {
        await certificate.verify(signingKey.keyPacket, enums.signature.certGeneric, dataToVerify, date, void 0, config2);
      } catch (e) {
        throw util.wrapError("User certificate is invalid", e);
      }
    }));
    return true;
  }
  /**
   * Verifies all user certificates
   * @param {Array<PublicKey>} verificationKeys - Array of keys to verify certificate signatures
   * @param {Date} [date] - Use the given date instead of the current time
   * @param {Object} config - Full configuration
   * @returns {Promise<Array<{
   *   keyID: module:type/keyid~KeyID,
   *   valid: Boolean | null
   * }>>} List of signer's keyID and validity of signature.
   *      Signature validity is null if the verification keys do not correspond to the certificate.
   * @async
   */
  async verifyAllCertifications(verificationKeys, date = /* @__PURE__ */ new Date(), config2) {
    const that = this;
    const certifications = this.selfCertifications.concat(this.otherCertifications);
    return Promise.all(certifications.map(async (certification) => ({
      keyID: certification.issuerKeyID,
      valid: await that.verifyCertificate(certification, verificationKeys, date, config2).catch(() => false)
    })));
  }
  /**
   * Verify User. Checks for existence of self signatures, revocation signatures
   * and validity of self signature.
   * @param {Date} date - Use the given date instead of the current time
   * @param {Object} config - Full configuration
   * @returns {Promise<true>} Status of user.
   * @throws {Error} if there are no valid self signatures.
   * @async
   */
  async verify(date = /* @__PURE__ */ new Date(), config2) {
    if (!this.selfCertifications.length) {
      throw new Error("No self-certifications found");
    }
    const that = this;
    const primaryKey = this.mainKey.keyPacket;
    const dataToVerify = {
      userID: this.userID,
      userAttribute: this.userAttribute,
      key: primaryKey
    };
    let exception;
    for (let i = this.selfCertifications.length - 1; i >= 0; i--) {
      try {
        const selfCertification = this.selfCertifications[i];
        if (selfCertification.revoked || await that.isRevoked(selfCertification, void 0, date, config2)) {
          throw new Error("Self-certification is revoked");
        }
        try {
          await selfCertification.verify(primaryKey, enums.signature.certGeneric, dataToVerify, date, void 0, config2);
        } catch (e) {
          throw util.wrapError("Self-certification is invalid", e);
        }
        return true;
      } catch (e) {
        exception = e;
      }
    }
    throw exception;
  }
  /**
   * Update user with new components from specified user
   * @param {User} sourceUser - Source user to merge
   * @param {Date} date - Date to verify the validity of signatures
   * @param {Object} config - Full configuration
   * @returns {Promise<undefined>}
   * @async
   */
  async update(sourceUser, date, config2) {
    const primaryKey = this.mainKey.keyPacket;
    const dataToVerify = {
      userID: this.userID,
      userAttribute: this.userAttribute,
      key: primaryKey
    };
    await mergeSignatures(sourceUser, this, "selfCertifications", date, async function(srcSelfSig) {
      try {
        await srcSelfSig.verify(primaryKey, enums.signature.certGeneric, dataToVerify, date, false, config2);
        return true;
      } catch (e) {
        return false;
      }
    });
    await mergeSignatures(sourceUser, this, "otherCertifications", date);
    await mergeSignatures(sourceUser, this, "revocationSignatures", date, function(srcRevSig) {
      return isDataRevoked(primaryKey, enums.signature.certRevocation, dataToVerify, [srcRevSig], void 0, void 0, date, config2);
    });
  }
  /**
   * Revokes the user
   * @param {SecretKeyPacket} primaryKey - decrypted private primary key for revocation
   * @param {Object} reasonForRevocation - optional, object indicating the reason for revocation
   * @param  {module:enums.reasonForRevocation} reasonForRevocation.flag optional, flag indicating the reason for revocation
   * @param  {String} reasonForRevocation.string optional, string explaining the reason for revocation
   * @param {Date} date - optional, override the creationtime of the revocation signature
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<User>} New user with revocation signature.
   * @async
   */
  async revoke(primaryKey, {
    flag: reasonForRevocationFlag = enums.reasonForRevocation.noReason,
    string: reasonForRevocationString = ""
  } = {}, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const dataToSign = {
      userID: this.userID,
      userAttribute: this.userAttribute,
      key: primaryKey
    };
    const user = new _User(dataToSign.userID || dataToSign.userAttribute, this.mainKey);
    user.revocationSignatures.push(await createSignaturePacket(dataToSign, [], primaryKey, {
      signatureType: enums.signature.certRevocation,
      reasonForRevocationFlag: enums.write(enums.reasonForRevocation, reasonForRevocationFlag),
      reasonForRevocationString
    }, date, void 0, void 0, false, config$1));
    await user.update(this);
    return user;
  }
};
var Subkey = class _Subkey {
  /**
   * @param {SecretSubkeyPacket|PublicSubkeyPacket} subkeyPacket - subkey packet to hold in the Subkey
   * @param {Key} mainKey - reference to main Key object, containing the primary key packet corresponding to the subkey
   */
  constructor(subkeyPacket, mainKey) {
    this.keyPacket = subkeyPacket;
    this.bindingSignatures = [];
    this.revocationSignatures = [];
    this.mainKey = mainKey;
  }
  /**
   * Transforms structured subkey data to packetlist
   * @returns {PacketList}
   */
  toPacketList() {
    const packetlist = new PacketList();
    packetlist.push(this.keyPacket);
    packetlist.push(...this.revocationSignatures);
    packetlist.push(...this.bindingSignatures);
    return packetlist;
  }
  /**
   * Shallow clone
   * @return {Subkey}
   */
  clone() {
    const subkey = new _Subkey(this.keyPacket, this.mainKey);
    subkey.bindingSignatures = [...this.bindingSignatures];
    subkey.revocationSignatures = [...this.revocationSignatures];
    return subkey;
  }
  /**
   * Checks if a binding signature of a subkey is revoked
   * @param {SignaturePacket} signature - The binding signature to verify
   * @param  {PublicSubkeyPacket|
   *          SecretSubkeyPacket|
   *          PublicKeyPacket|
   *          SecretKeyPacket} key, optional The key to verify the signature
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Boolean>} True if the binding signature is revoked.
   * @async
   */
  async isRevoked(signature, key, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const primaryKey = this.mainKey.keyPacket;
    return isDataRevoked(
      primaryKey,
      enums.signature.subkeyRevocation,
      {
        key: primaryKey,
        bind: this.keyPacket
      },
      this.revocationSignatures,
      signature,
      key,
      date,
      config$1
    );
  }
  /**
   * Verify subkey. Checks for revocation signatures, expiration time
   * and valid binding signature.
   * @param {Date} date - Use the given date instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<SignaturePacket>}
   * @throws {Error}           if the subkey is invalid.
   * @async
   */
  async verify(date = /* @__PURE__ */ new Date(), config$1 = config) {
    const primaryKey = this.mainKey.keyPacket;
    const dataToVerify = { key: primaryKey, bind: this.keyPacket };
    const bindingSignature = await getLatestValidSignature(this.bindingSignatures, primaryKey, enums.signature.subkeyBinding, dataToVerify, date, config$1);
    if (bindingSignature.revoked || await this.isRevoked(bindingSignature, null, date, config$1)) {
      throw new Error("Subkey is revoked");
    }
    if (isDataExpired(this.keyPacket, bindingSignature, date)) {
      throw new Error("Subkey is expired");
    }
    return bindingSignature;
  }
  /**
   * Returns the expiration time of the subkey or Infinity if key does not expire.
   * Returns null if the subkey is invalid.
   * @param {Date} date - Use the given date instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Date | Infinity | null>}
   * @async
   */
  async getExpirationTime(date = /* @__PURE__ */ new Date(), config$1 = config) {
    const primaryKey = this.mainKey.keyPacket;
    const dataToVerify = { key: primaryKey, bind: this.keyPacket };
    let bindingSignature;
    try {
      bindingSignature = await getLatestValidSignature(this.bindingSignatures, primaryKey, enums.signature.subkeyBinding, dataToVerify, date, config$1);
    } catch (e) {
      return null;
    }
    const keyExpiry = getKeyExpirationTime(this.keyPacket, bindingSignature);
    const sigExpiry = bindingSignature.getExpirationTime();
    return keyExpiry < sigExpiry ? keyExpiry : sigExpiry;
  }
  /**
   * Update subkey with new components from specified subkey
   * @param {Subkey} subkey - Source subkey to merge
   * @param {Date} [date] - Date to verify validity of signatures
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @throws {Error} if update failed
   * @async
   */
  async update(subkey, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const primaryKey = this.mainKey.keyPacket;
    if (!this.hasSameFingerprintAs(subkey)) {
      throw new Error("Subkey update method: fingerprints of subkeys not equal");
    }
    if (this.keyPacket.constructor.tag === enums.packet.publicSubkey && subkey.keyPacket.constructor.tag === enums.packet.secretSubkey) {
      this.keyPacket = subkey.keyPacket;
    }
    const that = this;
    const dataToVerify = { key: primaryKey, bind: that.keyPacket };
    await mergeSignatures(subkey, this, "bindingSignatures", date, async function(srcBindSig) {
      for (let i = 0; i < that.bindingSignatures.length; i++) {
        if (that.bindingSignatures[i].issuerKeyID.equals(srcBindSig.issuerKeyID)) {
          if (srcBindSig.created > that.bindingSignatures[i].created) {
            that.bindingSignatures[i] = srcBindSig;
          }
          return false;
        }
      }
      try {
        await srcBindSig.verify(primaryKey, enums.signature.subkeyBinding, dataToVerify, date, void 0, config$1);
        return true;
      } catch (e) {
        return false;
      }
    });
    await mergeSignatures(subkey, this, "revocationSignatures", date, function(srcRevSig) {
      return isDataRevoked(primaryKey, enums.signature.subkeyRevocation, dataToVerify, [srcRevSig], void 0, void 0, date, config$1);
    });
  }
  /**
   * Revokes the subkey
   * @param {SecretKeyPacket} primaryKey - decrypted private primary key for revocation
   * @param {Object} reasonForRevocation - optional, object indicating the reason for revocation
   * @param  {module:enums.reasonForRevocation} reasonForRevocation.flag optional, flag indicating the reason for revocation
   * @param  {String} reasonForRevocation.string optional, string explaining the reason for revocation
   * @param {Date} date - optional, override the creationtime of the revocation signature
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Subkey>} New subkey with revocation signature.
   * @async
   */
  async revoke(primaryKey, {
    flag: reasonForRevocationFlag = enums.reasonForRevocation.noReason,
    string: reasonForRevocationString = ""
  } = {}, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const dataToSign = { key: primaryKey, bind: this.keyPacket };
    const subkey = new _Subkey(this.keyPacket, this.mainKey);
    subkey.revocationSignatures.push(await createSignaturePacket(dataToSign, [], primaryKey, {
      signatureType: enums.signature.subkeyRevocation,
      reasonForRevocationFlag: enums.write(enums.reasonForRevocation, reasonForRevocationFlag),
      reasonForRevocationString
    }, date, void 0, void 0, false, config$1));
    await subkey.update(this);
    return subkey;
  }
  hasSameFingerprintAs(other) {
    return this.keyPacket.hasSameFingerprintAs(other.keyPacket || other);
  }
};
["getKeyID", "getFingerprint", "getAlgorithmInfo", "getCreationTime", "isDecrypted"].forEach((name2) => {
  Subkey.prototype[name2] = function() {
    return this.keyPacket[name2]();
  };
});
var allowedRevocationPackets = /* @__PURE__ */ util.constructAllowedPackets([SignaturePacket]);
var mainKeyPacketTags = /* @__PURE__ */ new Set([enums.packet.publicKey, enums.packet.privateKey]);
var keyPacketTags = /* @__PURE__ */ new Set([
  enums.packet.publicKey,
  enums.packet.privateKey,
  enums.packet.publicSubkey,
  enums.packet.privateSubkey
]);
var Key = class {
  /**
   * Transforms packetlist to structured key data
   * @param {PacketList} packetlist - The packets that form a key
   * @param {Set<enums.packet>} disallowedPackets - disallowed packet tags
   */
  packetListToStructure(packetlist, disallowedPackets = /* @__PURE__ */ new Set()) {
    let user;
    let primaryKeyID;
    let subkey;
    let ignoreUntil;
    for (const packet of packetlist) {
      if (packet instanceof UnparseablePacket) {
        const isUnparseableKeyPacket = keyPacketTags.has(packet.tag);
        if (isUnparseableKeyPacket && !ignoreUntil) {
          if (mainKeyPacketTags.has(packet.tag)) {
            ignoreUntil = mainKeyPacketTags;
          } else {
            ignoreUntil = keyPacketTags;
          }
        }
        continue;
      }
      const tag = packet.constructor.tag;
      if (ignoreUntil) {
        if (!ignoreUntil.has(tag)) continue;
        ignoreUntil = null;
      }
      if (disallowedPackets.has(tag)) {
        throw new Error(`Unexpected packet type: ${tag}`);
      }
      switch (tag) {
        case enums.packet.publicKey:
        case enums.packet.secretKey:
          if (this.keyPacket) {
            throw new Error("Key block contains multiple keys");
          }
          this.keyPacket = packet;
          primaryKeyID = this.getKeyID();
          if (!primaryKeyID) {
            throw new Error("Missing Key ID");
          }
          break;
        case enums.packet.userID:
        case enums.packet.userAttribute:
          user = new User(packet, this);
          this.users.push(user);
          break;
        case enums.packet.publicSubkey:
        case enums.packet.secretSubkey:
          user = null;
          subkey = new Subkey(packet, this);
          this.subkeys.push(subkey);
          break;
        case enums.packet.signature:
          switch (packet.signatureType) {
            case enums.signature.certGeneric:
            case enums.signature.certPersona:
            case enums.signature.certCasual:
            case enums.signature.certPositive:
              if (!user) {
                util.printDebug("Dropping certification signatures without preceding user packet");
                continue;
              }
              if (packet.issuerKeyID.equals(primaryKeyID)) {
                user.selfCertifications.push(packet);
              } else {
                user.otherCertifications.push(packet);
              }
              break;
            case enums.signature.certRevocation:
              if (user) {
                user.revocationSignatures.push(packet);
              } else {
                this.directSignatures.push(packet);
              }
              break;
            case enums.signature.key:
              this.directSignatures.push(packet);
              break;
            case enums.signature.subkeyBinding:
              if (!subkey) {
                util.printDebug("Dropping subkey binding signature without preceding subkey packet");
                continue;
              }
              subkey.bindingSignatures.push(packet);
              break;
            case enums.signature.keyRevocation:
              this.revocationSignatures.push(packet);
              break;
            case enums.signature.subkeyRevocation:
              if (!subkey) {
                util.printDebug("Dropping subkey revocation signature without preceding subkey packet");
                continue;
              }
              subkey.revocationSignatures.push(packet);
              break;
          }
          break;
      }
    }
  }
  /**
   * Transforms structured key data to packetlist
   * @returns {PacketList} The packets that form a key.
   */
  toPacketList() {
    const packetlist = new PacketList();
    packetlist.push(this.keyPacket);
    packetlist.push(...this.revocationSignatures);
    packetlist.push(...this.directSignatures);
    this.users.map((user) => packetlist.push(...user.toPacketList()));
    this.subkeys.map((subkey) => packetlist.push(...subkey.toPacketList()));
    return packetlist;
  }
  /**
   * Clones the key object. The copy is shallow, as it references the same packet objects as the original. However, if the top-level API is used, the two key instances are effectively independent.
   * @param {Boolean} [clonePrivateParams=false] Only relevant for private keys: whether the secret key paramenters should be deeply copied. This is needed if e.g. `encrypt()` is to be called either on the clone or the original key.
   * @returns {Promise<Key>} Clone of the key.
   */
  clone(clonePrivateParams = false) {
    const key = new this.constructor(this.toPacketList());
    if (clonePrivateParams) {
      key.getKeys().forEach((k) => {
        k.keyPacket = Object.create(
          Object.getPrototypeOf(k.keyPacket),
          Object.getOwnPropertyDescriptors(k.keyPacket)
        );
        if (!k.keyPacket.isDecrypted()) return;
        const privateParams = {};
        Object.keys(k.keyPacket.privateParams).forEach((name2) => {
          privateParams[name2] = new Uint8Array(k.keyPacket.privateParams[name2]);
        });
        k.keyPacket.privateParams = privateParams;
      });
    }
    return key;
  }
  /**
   * Returns an array containing all public or private subkeys matching keyID;
   * If no keyID is given, returns all subkeys.
   * @param {type/keyID} [keyID] - key ID to look for
   * @returns {Array<Subkey>} array of subkeys
   */
  getSubkeys(keyID = null) {
    const subkeys = this.subkeys.filter((subkey) => !keyID || subkey.getKeyID().equals(keyID, true));
    return subkeys;
  }
  /**
   * Returns an array containing all public or private keys matching keyID.
   * If no keyID is given, returns all keys, starting with the primary key.
   * @param {type/keyid~KeyID} [keyID] - key ID to look for
   * @returns {Array<Key|Subkey>} array of keys
   */
  getKeys(keyID = null) {
    const keys = [];
    if (!keyID || this.getKeyID().equals(keyID, true)) {
      keys.push(this);
    }
    return keys.concat(this.getSubkeys(keyID));
  }
  /**
   * Returns key IDs of all keys
   * @returns {Array<module:type/keyid~KeyID>}
   */
  getKeyIDs() {
    return this.getKeys().map((key) => key.getKeyID());
  }
  /**
   * Returns userIDs
   * @returns {Array<string>} Array of userIDs.
   */
  getUserIDs() {
    return this.users.map((user) => {
      return user.userID ? user.userID.userID : null;
    }).filter((userID) => userID !== null);
  }
  /**
   * Returns binary encoded key
   * @returns {Uint8Array} Binary key.
   */
  write() {
    return this.toPacketList().write();
  }
  /**
   * Returns last created key or key by given keyID that is available for signing and verification
   * @param  {module:type/keyid~KeyID} [keyID] - key ID of a specific key to retrieve
   * @param  {Date} [date] - use the fiven date date to  to check key validity instead of the current date
   * @param  {Object} [userID] - filter keys for the given user ID
   * @param  {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Key|Subkey>} signing key
   * @throws if no valid signing key was found
   * @async
   */
  async getSigningKey(keyID = null, date = /* @__PURE__ */ new Date(), userID = {}, config$1 = config) {
    await this.verifyPrimaryKey(date, userID, config$1);
    const primaryKey = this.keyPacket;
    try {
      checkKeyRequirements(primaryKey, config$1);
    } catch (err2) {
      throw util.wrapError("Could not verify primary key", err2);
    }
    const subkeys = this.subkeys.slice().sort((a, b) => b.keyPacket.created - a.keyPacket.created);
    let exception;
    for (const subkey of subkeys) {
      if (!keyID || subkey.getKeyID().equals(keyID)) {
        try {
          await subkey.verify(date, config$1);
          const dataToVerify = { key: primaryKey, bind: subkey.keyPacket };
          const bindingSignature = await getLatestValidSignature(
            subkey.bindingSignatures,
            primaryKey,
            enums.signature.subkeyBinding,
            dataToVerify,
            date,
            config$1
          );
          if (!validateSigningKeyPacket(subkey.keyPacket, bindingSignature, config$1)) {
            continue;
          }
          if (!bindingSignature.embeddedSignature) {
            throw new Error("Missing embedded signature");
          }
          await getLatestValidSignature(
            [bindingSignature.embeddedSignature],
            subkey.keyPacket,
            enums.signature.keyBinding,
            dataToVerify,
            date,
            config$1
          );
          checkKeyRequirements(subkey.keyPacket, config$1);
          return subkey;
        } catch (e) {
          exception = e;
        }
      }
    }
    try {
      const selfCertification = await this.getPrimarySelfSignature(date, userID, config$1);
      if ((!keyID || primaryKey.getKeyID().equals(keyID)) && validateSigningKeyPacket(primaryKey, selfCertification, config$1)) {
        checkKeyRequirements(primaryKey, config$1);
        return this;
      }
    } catch (e) {
      exception = e;
    }
    throw util.wrapError("Could not find valid signing key packet in key " + this.getKeyID().toHex(), exception);
  }
  /**
   * Returns last created key or key by given keyID that is available for encryption or decryption
   * @param  {module:type/keyid~KeyID} [keyID] - key ID of a specific key to retrieve
   * @param  {Date}   [date] - use the fiven date date to  to check key validity instead of the current date
   * @param  {Object} [userID] - filter keys for the given user ID
   * @param  {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Key|Subkey>} encryption key
   * @throws if no valid encryption key was found
   * @async
   */
  async getEncryptionKey(keyID, date = /* @__PURE__ */ new Date(), userID = {}, config$1 = config) {
    await this.verifyPrimaryKey(date, userID, config$1);
    const primaryKey = this.keyPacket;
    try {
      checkKeyRequirements(primaryKey, config$1);
    } catch (err2) {
      throw util.wrapError("Could not verify primary key", err2);
    }
    const subkeys = this.subkeys.slice().sort((a, b) => b.keyPacket.created - a.keyPacket.created);
    let exception;
    for (const subkey of subkeys) {
      if (!keyID || subkey.getKeyID().equals(keyID)) {
        try {
          await subkey.verify(date, config$1);
          const dataToVerify = { key: primaryKey, bind: subkey.keyPacket };
          const bindingSignature = await getLatestValidSignature(subkey.bindingSignatures, primaryKey, enums.signature.subkeyBinding, dataToVerify, date, config$1);
          if (validateEncryptionKeyPacket(subkey.keyPacket, bindingSignature, config$1)) {
            checkKeyRequirements(subkey.keyPacket, config$1);
            return subkey;
          }
        } catch (e) {
          exception = e;
        }
      }
    }
    try {
      const selfCertification = await this.getPrimarySelfSignature(date, userID, config$1);
      if ((!keyID || primaryKey.getKeyID().equals(keyID)) && validateEncryptionKeyPacket(primaryKey, selfCertification, config$1)) {
        checkKeyRequirements(primaryKey, config$1);
        return this;
      }
    } catch (e) {
      exception = e;
    }
    throw util.wrapError("Could not find valid encryption key packet in key " + this.getKeyID().toHex(), exception);
  }
  /**
   * Checks if a signature on a key is revoked
   * @param {SignaturePacket} signature - The signature to verify
   * @param  {PublicSubkeyPacket|
   *          SecretSubkeyPacket|
   *          PublicKeyPacket|
   *          SecretKeyPacket} key, optional The key to verify the signature
   * @param {Date} [date] - Use the given date for verification, instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Boolean>} True if the certificate is revoked.
   * @async
   */
  async isRevoked(signature, key, date = /* @__PURE__ */ new Date(), config$1 = config) {
    return isDataRevoked(
      this.keyPacket,
      enums.signature.keyRevocation,
      { key: this.keyPacket },
      this.revocationSignatures,
      signature,
      key,
      date,
      config$1
    );
  }
  /**
   * Verify primary key. Checks for revocation signatures, expiration time
   * and valid self signature. Throws if the primary key is invalid.
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [userID] - User ID
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @throws {Error} If key verification failed
   * @async
   */
  async verifyPrimaryKey(date = /* @__PURE__ */ new Date(), userID = {}, config$1 = config) {
    const primaryKey = this.keyPacket;
    if (await this.isRevoked(null, null, date, config$1)) {
      throw new Error("Primary key is revoked");
    }
    const selfCertification = await this.getPrimarySelfSignature(date, userID, config$1);
    if (isDataExpired(primaryKey, selfCertification, date)) {
      throw new Error("Primary key is expired");
    }
    if (primaryKey.version !== 6) {
      const directSignature = await getLatestValidSignature(
        this.directSignatures,
        primaryKey,
        enums.signature.key,
        { key: primaryKey },
        date,
        config$1
      ).catch(() => {
      });
      if (directSignature && isDataExpired(primaryKey, directSignature, date)) {
        throw new Error("Primary key is expired");
      }
    }
  }
  /**
   * Returns the expiration date of the primary key, considering self-certifications and direct-key signatures.
   * Returns `Infinity` if the key doesn't expire, or `null` if the key is revoked or invalid.
   * @param  {Object} [userID] - User ID to consider instead of the primary user
   * @param  {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Date | Infinity | null>}
   * @async
   */
  async getExpirationTime(userID, config$1 = config) {
    let primaryKeyExpiry;
    try {
      const selfCertification = await this.getPrimarySelfSignature(null, userID, config$1);
      const selfSigKeyExpiry = getKeyExpirationTime(this.keyPacket, selfCertification);
      const selfSigExpiry = selfCertification.getExpirationTime();
      const directSignature = this.keyPacket.version !== 6 && // For V6 keys, the above already returns the direct-key signature.
      await getLatestValidSignature(
        this.directSignatures,
        this.keyPacket,
        enums.signature.key,
        { key: this.keyPacket },
        null,
        config$1
      ).catch(() => {
      });
      if (directSignature) {
        const directSigKeyExpiry = getKeyExpirationTime(this.keyPacket, directSignature);
        primaryKeyExpiry = Math.min(selfSigKeyExpiry, selfSigExpiry, directSigKeyExpiry);
      } else {
        primaryKeyExpiry = selfSigKeyExpiry < selfSigExpiry ? selfSigKeyExpiry : selfSigExpiry;
      }
    } catch (e) {
      primaryKeyExpiry = null;
    }
    return util.normalizeDate(primaryKeyExpiry);
  }
  /**
   * For V4 keys, returns the self-signature of the primary user.
   * For V5 keys, returns the latest valid direct-key self-signature.
   * This self-signature is to be used to check the key expiration,
   * algorithm preferences, and so on.
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [userID] - User ID to get instead of the primary user for V4 keys, if it exists
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<SignaturePacket>} The primary self-signature
   * @async
   */
  async getPrimarySelfSignature(date = /* @__PURE__ */ new Date(), userID = {}, config$1 = config) {
    const primaryKey = this.keyPacket;
    if (primaryKey.version === 6) {
      return getLatestValidSignature(
        this.directSignatures,
        primaryKey,
        enums.signature.key,
        { key: primaryKey },
        date,
        config$1
      );
    }
    const { selfCertification } = await this.getPrimaryUser(date, userID, config$1);
    return selfCertification;
  }
  /**
   * Returns primary user and most significant (latest valid) self signature
   * - if multiple primary users exist, returns the one with the latest self signature
   * - otherwise, returns the user with the latest self signature
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [userID] - User ID to get instead of the primary user, if it exists
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<{
   *   user: User,
   *   selfCertification: SignaturePacket
   * }>} The primary user and the self signature
   * @async
   */
  async getPrimaryUser(date = /* @__PURE__ */ new Date(), userID = {}, config$1 = config) {
    const primaryKey = this.keyPacket;
    const users = [];
    let exception;
    for (let i = 0; i < this.users.length; i++) {
      try {
        const user2 = this.users[i];
        if (!user2.userID) {
          continue;
        }
        if (userID.name !== void 0 && user2.userID.name !== userID.name || userID.email !== void 0 && user2.userID.email !== userID.email || userID.comment !== void 0 && user2.userID.comment !== userID.comment) {
          throw new Error("Could not find user that matches that user ID");
        }
        const dataToVerify = { userID: user2.userID, key: primaryKey };
        const selfCertification = await getLatestValidSignature(user2.selfCertifications, primaryKey, enums.signature.certGeneric, dataToVerify, date, config$1);
        users.push({ index: i, user: user2, selfCertification });
      } catch (e) {
        exception = e;
      }
    }
    if (!users.length) {
      throw exception || new Error("Could not find primary user");
    }
    await Promise.all(users.map(async function(a) {
      return a.selfCertification.revoked || a.user.isRevoked(a.selfCertification, null, date, config$1);
    }));
    const primaryUser = users.sort(function(a, b) {
      const A2 = a.selfCertification;
      const B = b.selfCertification;
      return B.revoked - A2.revoked || A2.isPrimaryUserID - B.isPrimaryUserID || A2.created - B.created;
    }).pop();
    const { user, selfCertification: cert } = primaryUser;
    if (cert.revoked || await user.isRevoked(cert, null, date, config$1)) {
      throw new Error("Primary user is revoked");
    }
    return primaryUser;
  }
  /**
   * Update key with new components from specified key with same key ID:
   * users, subkeys, certificates are merged into the destination key,
   * duplicates and expired signatures are ignored.
   *
   * If the source key is a private key and the destination key is public,
   * a private key is returned.
   * @param {Key} sourceKey - Source key to merge
   * @param {Date} [date] - Date to verify validity of signatures and keys
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Key>} updated key
   * @async
   */
  async update(sourceKey, date = /* @__PURE__ */ new Date(), config$1 = config) {
    if (!this.hasSameFingerprintAs(sourceKey)) {
      throw new Error("Primary key fingerprints must be equal to update the key");
    }
    if (!this.isPrivate() && sourceKey.isPrivate()) {
      const equal = this.subkeys.length === sourceKey.subkeys.length && this.subkeys.every((destSubkey) => {
        return sourceKey.subkeys.some((srcSubkey) => {
          return destSubkey.hasSameFingerprintAs(srcSubkey);
        });
      });
      if (!equal) {
        throw new Error("Cannot update public key with private key if subkeys mismatch");
      }
      return sourceKey.update(this, config$1);
    }
    const updatedKey = this.clone();
    await mergeSignatures(sourceKey, updatedKey, "revocationSignatures", date, (srcRevSig) => {
      return isDataRevoked(updatedKey.keyPacket, enums.signature.keyRevocation, updatedKey, [srcRevSig], null, sourceKey.keyPacket, date, config$1);
    });
    await mergeSignatures(sourceKey, updatedKey, "directSignatures", date);
    await Promise.all(sourceKey.users.map(async (srcUser) => {
      const usersToUpdate = updatedKey.users.filter((dstUser) => srcUser.userID && srcUser.userID.equals(dstUser.userID) || srcUser.userAttribute && srcUser.userAttribute.equals(dstUser.userAttribute));
      if (usersToUpdate.length > 0) {
        await Promise.all(
          usersToUpdate.map((userToUpdate) => userToUpdate.update(srcUser, date, config$1))
        );
      } else {
        const newUser = srcUser.clone();
        newUser.mainKey = updatedKey;
        updatedKey.users.push(newUser);
      }
    }));
    await Promise.all(sourceKey.subkeys.map(async (srcSubkey) => {
      const subkeysToUpdate = updatedKey.subkeys.filter((dstSubkey) => dstSubkey.hasSameFingerprintAs(srcSubkey));
      if (subkeysToUpdate.length > 0) {
        await Promise.all(
          subkeysToUpdate.map((subkeyToUpdate) => subkeyToUpdate.update(srcSubkey, date, config$1))
        );
      } else {
        const newSubkey = srcSubkey.clone();
        newSubkey.mainKey = updatedKey;
        updatedKey.subkeys.push(newSubkey);
      }
    }));
    return updatedKey;
  }
  /**
   * Get revocation certificate from a revoked key.
   *   (To get a revocation certificate for an unrevoked key, call revoke() first.)
   * @param {Date} date - Use the given date instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<String>} Armored revocation certificate.
   * @async
   */
  async getRevocationCertificate(date = /* @__PURE__ */ new Date(), config$1 = config) {
    const dataToVerify = { key: this.keyPacket };
    const revocationSignature = await getLatestValidSignature(this.revocationSignatures, this.keyPacket, enums.signature.keyRevocation, dataToVerify, date, config$1);
    const packetlist = new PacketList();
    packetlist.push(revocationSignature);
    const emitChecksum = this.keyPacket.version !== 6;
    return armor(enums.armor.publicKey, packetlist.write(), null, null, "This is a revocation certificate", emitChecksum, config$1);
  }
  /**
   * Applies a revocation certificate to a key
   * This adds the first signature packet in the armored text to the key,
   * if it is a valid revocation signature.
   * @param {String} revocationCertificate - armored revocation certificate
   * @param {Date} [date] - Date to verify the certificate
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Key>} Revoked key.
   * @async
   */
  async applyRevocationCertificate(revocationCertificate, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const input = await unarmor(revocationCertificate);
    const packetlist = await PacketList.fromBinary(input.data, allowedRevocationPackets, config$1);
    const revocationSignature = packetlist.findPacket(enums.packet.signature);
    if (!revocationSignature || revocationSignature.signatureType !== enums.signature.keyRevocation) {
      throw new Error("Could not find revocation signature packet");
    }
    if (!revocationSignature.issuerKeyID.equals(this.getKeyID())) {
      throw new Error("Revocation signature does not match key");
    }
    try {
      await revocationSignature.verify(this.keyPacket, enums.signature.keyRevocation, { key: this.keyPacket }, date, void 0, config$1);
    } catch (e) {
      throw util.wrapError("Could not verify revocation signature", e);
    }
    const key = this.clone();
    key.revocationSignatures.push(revocationSignature);
    return key;
  }
  /**
   * Signs primary user of key
   * @param {Array<PrivateKey>} privateKeys - decrypted private keys for signing
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [userID] - User ID to get instead of the primary user, if it exists
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Key>} Key with new certificate signature.
   * @async
   */
  async signPrimaryUser(privateKeys, date, userID, config$1 = config) {
    const { index: index2, user } = await this.getPrimaryUser(date, userID, config$1);
    const userSign = await user.certify(privateKeys, date, config$1);
    const key = this.clone();
    key.users[index2] = userSign;
    return key;
  }
  /**
   * Signs all users of key
   * @param {Array<PrivateKey>} privateKeys - decrypted private keys for signing
   * @param {Date} [date] - Use the given date for signing, instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Key>} Key with new certificate signature.
   * @async
   */
  async signAllUsers(privateKeys, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const key = this.clone();
    key.users = await Promise.all(this.users.map(function(user) {
      return user.certify(privateKeys, date, config$1);
    }));
    return key;
  }
  /**
   * Verifies primary user of key
   * - if no arguments are given, verifies the self certificates;
   * - otherwise, verifies all certificates signed with given keys.
   * @param {Array<PublicKey>} [verificationKeys] - array of keys to verify certificate signatures, instead of the primary key
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [userID] - User ID to get instead of the primary user, if it exists
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<{
   *   keyID: module:type/keyid~KeyID,
   *   valid: Boolean|null
   * }>>} List of signer's keyID and validity of signature.
   *      Signature validity is null if the verification keys do not correspond to the certificate.
   * @async
   */
  async verifyPrimaryUser(verificationKeys, date = /* @__PURE__ */ new Date(), userID, config$1 = config) {
    const primaryKey = this.keyPacket;
    const { user } = await this.getPrimaryUser(date, userID, config$1);
    const results = verificationKeys ? await user.verifyAllCertifications(verificationKeys, date, config$1) : [{ keyID: primaryKey.getKeyID(), valid: await user.verify(date, config$1).catch(() => false) }];
    return results;
  }
  /**
   * Verifies all users of key
   * - if no arguments are given, verifies the self certificates;
   * - otherwise, verifies all certificates signed with given keys.
   * @param {Array<PublicKey>} [verificationKeys] - array of keys to verify certificate signatures
   * @param {Date} [date] - Use the given date for verification instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<{
   *   userID: String,
   *   keyID: module:type/keyid~KeyID,
   *   valid: Boolean|null
   * }>>} List of userID, signer's keyID and validity of signature.
   *      Signature validity is null if the verification keys do not correspond to the certificate.
   * @async
   */
  async verifyAllUsers(verificationKeys, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const primaryKey = this.keyPacket;
    const results = [];
    await Promise.all(this.users.map(async (user) => {
      const signatures = verificationKeys ? await user.verifyAllCertifications(verificationKeys, date, config$1) : [{ keyID: primaryKey.getKeyID(), valid: await user.verify(date, config$1).catch(() => false) }];
      results.push(
        ...signatures.map(
          (signature) => ({
            userID: user.userID ? user.userID.userID : null,
            userAttribute: user.userAttribute,
            keyID: signature.keyID,
            valid: signature.valid
          })
        )
      );
    }));
    return results;
  }
};
["getKeyID", "getFingerprint", "getAlgorithmInfo", "getCreationTime", "hasSameFingerprintAs"].forEach((name2) => {
  Key.prototype[name2] = Subkey.prototype[name2];
});
var PublicKey = class extends Key {
  /**
   * @param {PacketList} packetlist - The packets that form this key
   */
  constructor(packetlist) {
    super();
    this.keyPacket = null;
    this.revocationSignatures = [];
    this.directSignatures = [];
    this.users = [];
    this.subkeys = [];
    if (packetlist) {
      this.packetListToStructure(packetlist, /* @__PURE__ */ new Set([enums.packet.secretKey, enums.packet.secretSubkey]));
      if (!this.keyPacket) {
        throw new Error("Invalid key: missing public-key packet");
      }
    }
  }
  /**
   * Returns true if this is a private key
   * @returns {false}
   */
  isPrivate() {
    return false;
  }
  /**
   * Returns key as public key (shallow copy)
   * @returns {PublicKey} New public Key
   */
  toPublic() {
    return this;
  }
  /**
   * Returns ASCII armored text of key
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {ReadableStream<String>} ASCII armor.
   */
  armor(config$1 = config) {
    const emitChecksum = this.keyPacket.version !== 6;
    return armor(enums.armor.publicKey, this.toPacketList().write(), void 0, void 0, void 0, emitChecksum, config$1);
  }
};
var PrivateKey = class _PrivateKey extends PublicKey {
  /**
  * @param {PacketList} packetlist - The packets that form this key
  */
  constructor(packetlist) {
    super();
    this.packetListToStructure(packetlist, /* @__PURE__ */ new Set([enums.packet.publicKey, enums.packet.publicSubkey]));
    if (!this.keyPacket) {
      throw new Error("Invalid key: missing private-key packet");
    }
  }
  /**
   * Returns true if this is a private key
   * @returns {Boolean}
   */
  isPrivate() {
    return true;
  }
  /**
   * Returns key as public key (shallow copy)
   * @returns {PublicKey} New public Key
   */
  toPublic() {
    const packetlist = new PacketList();
    const keyPackets = this.toPacketList();
    for (const keyPacket of keyPackets) {
      switch (keyPacket.constructor.tag) {
        case enums.packet.secretKey: {
          const pubKeyPacket = PublicKeyPacket.fromSecretKeyPacket(keyPacket);
          packetlist.push(pubKeyPacket);
          break;
        }
        case enums.packet.secretSubkey: {
          const pubSubkeyPacket = PublicSubkeyPacket.fromSecretSubkeyPacket(keyPacket);
          packetlist.push(pubSubkeyPacket);
          break;
        }
        default:
          packetlist.push(keyPacket);
      }
    }
    return new PublicKey(packetlist);
  }
  /**
   * Returns ASCII armored text of key
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {ReadableStream<String>} ASCII armor.
   */
  armor(config$1 = config) {
    const emitChecksum = this.keyPacket.version !== 6;
    return armor(enums.armor.privateKey, this.toPacketList().write(), void 0, void 0, void 0, emitChecksum, config$1);
  }
  /**
   * Returns all keys that are available for decryption, matching the keyID when given
   * This is useful to retrieve keys for session key decryption
   * @param  {module:type/keyid~KeyID} keyID, optional
   * @param  {Date}              date, optional
   * @param  {String}            userID, optional
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<Key|Subkey>>} Array of decryption keys.
   * @throws {Error} if no decryption key is found
   * @async
   */
  async getDecryptionKeys(keyID, date = /* @__PURE__ */ new Date(), userID = {}, config$1 = config) {
    const primaryKey = this.keyPacket;
    const keys = [];
    let exception = null;
    for (let i = 0; i < this.subkeys.length; i++) {
      if (!keyID || this.subkeys[i].getKeyID().equals(keyID, true)) {
        if (this.subkeys[i].keyPacket.isDummy()) {
          exception = exception || new Error("Gnu-dummy key packets cannot be used for decryption");
          continue;
        }
        try {
          const dataToVerify = { key: primaryKey, bind: this.subkeys[i].keyPacket };
          const bindingSignature = await getLatestValidSignature(this.subkeys[i].bindingSignatures, primaryKey, enums.signature.subkeyBinding, dataToVerify, date, config$1);
          if (validateDecryptionKeyPacket(this.subkeys[i].keyPacket, bindingSignature, config$1)) {
            keys.push(this.subkeys[i]);
          }
        } catch (e) {
          exception = e;
        }
      }
    }
    const selfCertification = await this.getPrimarySelfSignature(date, userID, config$1);
    if ((!keyID || primaryKey.getKeyID().equals(keyID, true)) && validateDecryptionKeyPacket(primaryKey, selfCertification, config$1)) {
      if (primaryKey.isDummy()) {
        exception = exception || new Error("Gnu-dummy key packets cannot be used for decryption");
      } else {
        keys.push(this);
      }
    }
    if (keys.length === 0) {
      throw exception || new Error("No decryption key packets found");
    }
    return keys;
  }
  /**
   * Returns true if the primary key or any subkey is decrypted.
   * A dummy key is considered encrypted.
   */
  isDecrypted() {
    return this.getKeys().some(({ keyPacket }) => keyPacket.isDecrypted());
  }
  /**
   * Check whether the private and public primary key parameters correspond
   * Together with verification of binding signatures, this guarantees key integrity
   * In case of gnu-dummy primary key, it is enough to validate any signing subkeys
   *   otherwise all encryption subkeys are validated
   * If only gnu-dummy keys are found, we cannot properly validate so we throw an error
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @throws {Error} if validation was not successful and the key cannot be trusted
   * @async
   */
  async validate(config$1 = config) {
    if (!this.isPrivate()) {
      throw new Error("Cannot validate a public key");
    }
    let signingKeyPacket;
    if (!this.keyPacket.isDummy()) {
      signingKeyPacket = this.keyPacket;
    } else {
      const signingKey = await this.getSigningKey(null, null, void 0, { ...config$1, rejectPublicKeyAlgorithms: /* @__PURE__ */ new Set(), minRSABits: 0 });
      if (signingKey && !signingKey.keyPacket.isDummy()) {
        signingKeyPacket = signingKey.keyPacket;
      }
    }
    if (signingKeyPacket) {
      return signingKeyPacket.validate();
    } else {
      const keys = this.getKeys();
      const allDummies = keys.map((key) => key.keyPacket.isDummy()).every(Boolean);
      if (allDummies) {
        throw new Error("Cannot validate an all-gnu-dummy key");
      }
      return Promise.all(keys.map(async (key) => key.keyPacket.validate()));
    }
  }
  /**
   * Clear private key parameters
   */
  clearPrivateParams() {
    this.getKeys().forEach(({ keyPacket }) => {
      if (keyPacket.isDecrypted()) {
        keyPacket.clearPrivateParams();
      }
    });
  }
  /**
   * Revokes the key
   * @param {Object} reasonForRevocation - optional, object indicating the reason for revocation
   * @param  {module:enums.reasonForRevocation} reasonForRevocation.flag optional, flag indicating the reason for revocation
   * @param  {String} reasonForRevocation.string optional, string explaining the reason for revocation
   * @param {Date} date - optional, override the creationtime of the revocation signature
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<PrivateKey>} New key with revocation signature.
   * @async
   */
  async revoke({
    flag: reasonForRevocationFlag = enums.reasonForRevocation.noReason,
    string: reasonForRevocationString = ""
  } = {}, date = /* @__PURE__ */ new Date(), config$1 = config) {
    if (!this.isPrivate()) {
      throw new Error("Need private key for revoking");
    }
    const dataToSign = { key: this.keyPacket };
    const key = this.clone();
    key.revocationSignatures.push(await createSignaturePacket(dataToSign, [], this.keyPacket, {
      signatureType: enums.signature.keyRevocation,
      reasonForRevocationFlag: enums.write(enums.reasonForRevocation, reasonForRevocationFlag),
      reasonForRevocationString
    }, date, void 0, void 0, void 0, config$1));
    return key;
  }
  /**
   * Generates a new OpenPGP subkey, and returns a clone of the Key object with the new subkey added.
   * Supports RSA and ECC keys, as well as the newer Curve448 and Curve25519.
   * Defaults to the algorithm and bit size/curve of the primary key. DSA primary keys default to RSA subkeys.
   * @param {ecc|rsa|curve25519|curve448} options.type The subkey algorithm: ECC, RSA, Curve448 or Curve25519 (new format).
   *                                                   Note: Curve448 and Curve25519 are not widely supported yet.
   * @param {String}  options.curve      (optional) Elliptic curve for ECC keys
   * @param {Integer} options.rsaBits    (optional) Number of bits for RSA subkeys
   * @param {Number}  options.keyExpirationTime (optional) Number of seconds from the key creation time after which the key expires
   * @param {Date}    options.date       (optional) Override the creation date of the key and the key signatures
   * @param {Boolean} options.sign       (optional) Indicates whether the subkey should sign rather than encrypt. Defaults to false
   * @param {Object}  options.config     (optional) custom configuration settings to overwrite those in [config]{@link module:config}
   * @returns {Promise<PrivateKey>}
   * @async
   */
  async addSubkey(options = {}) {
    const config$1 = { ...config, ...options.config };
    if (options.passphrase) {
      throw new Error("Subkey could not be encrypted here, please encrypt whole key");
    }
    if (options.rsaBits < config$1.minRSABits) {
      throw new Error(`rsaBits should be at least ${config$1.minRSABits}, got: ${options.rsaBits}`);
    }
    const secretKeyPacket = this.keyPacket;
    if (secretKeyPacket.isDummy()) {
      throw new Error("Cannot add subkey to gnu-dummy primary key");
    }
    if (!secretKeyPacket.isDecrypted()) {
      throw new Error("Key is not decrypted");
    }
    const defaultOptions = secretKeyPacket.getAlgorithmInfo();
    defaultOptions.type = getDefaultSubkeyType(defaultOptions.algorithm);
    defaultOptions.rsaBits = defaultOptions.bits || 4096;
    defaultOptions.curve = defaultOptions.curve || "curve25519Legacy";
    options = sanitizeKeyOptions(options, defaultOptions);
    const keyPacket = await generateSecretSubkey(options, { ...config$1, v6Keys: this.keyPacket.version === 6 });
    checkKeyRequirements(keyPacket, config$1);
    const bindingSignature = await createBindingSignature(keyPacket, secretKeyPacket, options, config$1);
    const packetList = this.toPacketList();
    packetList.push(keyPacket, bindingSignature);
    return new _PrivateKey(packetList);
  }
};
function getDefaultSubkeyType(algoName) {
  const algo = enums.write(enums.publicKey, algoName);
  switch (algo) {
    case enums.publicKey.rsaEncrypt:
    case enums.publicKey.rsaEncryptSign:
    case enums.publicKey.rsaSign:
    case enums.publicKey.dsa:
      return "rsa";
    case enums.publicKey.ecdsa:
    case enums.publicKey.eddsaLegacy:
      return "ecc";
    case enums.publicKey.ed25519:
      return "curve25519";
    case enums.publicKey.ed448:
      return "curve448";
    default:
      throw new Error("Unsupported algorithm");
  }
}
var allowedKeyPackets = /* @__PURE__ */ util.constructAllowedPackets([
  PublicKeyPacket,
  PublicSubkeyPacket,
  SecretKeyPacket,
  SecretSubkeyPacket,
  UserIDPacket,
  UserAttributePacket,
  SignaturePacket
]);
function createKey(packetlist) {
  for (const packet of packetlist) {
    switch (packet.constructor.tag) {
      case enums.packet.secretKey:
        return new PrivateKey(packetlist);
      case enums.packet.publicKey:
        return new PublicKey(packetlist);
    }
  }
  throw new Error("No key packet found");
}
async function readKey({ armoredKey, binaryKey, config: config$1, ...rest }) {
  config$1 = { ...config, ...config$1 };
  if (!armoredKey && !binaryKey) {
    throw new Error("readKey: must pass options object containing `armoredKey` or `binaryKey`");
  }
  if (armoredKey && !util.isString(armoredKey)) {
    throw new Error("readKey: options.armoredKey must be a string");
  }
  if (binaryKey && !util.isUint8Array(binaryKey)) {
    throw new Error("readKey: options.binaryKey must be a Uint8Array");
  }
  const unknownOptions = Object.keys(rest);
  if (unknownOptions.length > 0) throw new Error(`Unknown option: ${unknownOptions.join(", ")}`);
  let input;
  if (armoredKey) {
    const { type, data } = await unarmor(armoredKey);
    if (!(type === enums.armor.publicKey || type === enums.armor.privateKey)) {
      throw new Error("Armored text not of type key");
    }
    input = data;
  } else {
    input = binaryKey;
  }
  const packetlist = await PacketList.fromBinary(input, allowedKeyPackets, config$1);
  const keyIndex = packetlist.indexOfTag(enums.packet.publicKey, enums.packet.secretKey);
  if (keyIndex.length === 0) {
    throw new Error("No key packet found");
  }
  const firstKeyPacketList = packetlist.slice(keyIndex[0], keyIndex[1]);
  return createKey(firstKeyPacketList);
}
var allowedSymSessionKeyPackets = /* @__PURE__ */ util.constructAllowedPackets([SymEncryptedSessionKeyPacket]);
var allowedDetachedSignaturePackets = /* @__PURE__ */ util.constructAllowedPackets([SignaturePacket]);
var Message = class _Message {
  /**
   * @param {PacketList} packetlist - The packets that form this message
   */
  constructor(packetlist) {
    this.packets = packetlist || new PacketList();
  }
  /**
   * Returns the key IDs of the keys to which the session key is encrypted
   * @returns {Array<module:type/keyid~KeyID>} Array of keyID objects.
   */
  getEncryptionKeyIDs() {
    const keyIDs = [];
    const pkESKeyPacketlist = this.packets.filterByTag(enums.packet.publicKeyEncryptedSessionKey);
    pkESKeyPacketlist.forEach(function(packet) {
      keyIDs.push(packet.publicKeyID);
    });
    return keyIDs;
  }
  /**
   * Returns the key IDs of the keys that signed the message
   * @returns {Array<module:type/keyid~KeyID>} Array of keyID objects.
   */
  getSigningKeyIDs() {
    const msg = this.unwrapCompressed();
    const onePassSigList = msg.packets.filterByTag(enums.packet.onePassSignature);
    if (onePassSigList.length > 0) {
      return onePassSigList.map((packet) => packet.issuerKeyID);
    }
    const signatureList = msg.packets.filterByTag(enums.packet.signature);
    return signatureList.map((packet) => packet.issuerKeyID);
  }
  /**
   * Decrypt the message. Either a private key, a session key, or a password must be specified.
   * @param {Array<PrivateKey>} [decryptionKeys] - Private keys with decrypted secret data
   * @param {Array<String>} [passwords] - Passwords used to decrypt
   * @param {Array<Object>} [sessionKeys] - Session keys in the form: { data:Uint8Array, algorithm:String, [aeadAlgorithm:String] }
   * @param {Date} [date] - Use the given date for key verification instead of the current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Message>} New message with decrypted content.
   * @async
   */
  async decrypt(decryptionKeys, passwords, sessionKeys, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const symEncryptedPacketlist = this.packets.filterByTag(
      enums.packet.symmetricallyEncryptedData,
      enums.packet.symEncryptedIntegrityProtectedData,
      enums.packet.aeadEncryptedData
    );
    if (symEncryptedPacketlist.length === 0) {
      throw new Error("No encrypted data found");
    }
    const symEncryptedPacket = symEncryptedPacketlist[0];
    const expectedSymmetricAlgorithm = symEncryptedPacket.cipherAlgorithm;
    const sessionKeyObjects = sessionKeys || await this.decryptSessionKeys(decryptionKeys, passwords, expectedSymmetricAlgorithm, date, config$1);
    let exception = null;
    const decryptedPromise = Promise.all(sessionKeyObjects.map(async ({ algorithm: algorithmName, data }) => {
      if (!util.isUint8Array(data) || !symEncryptedPacket.cipherAlgorithm && !util.isString(algorithmName)) {
        throw new Error("Invalid session key for decryption.");
      }
      try {
        const algo = symEncryptedPacket.cipherAlgorithm || enums.write(enums.symmetric, algorithmName);
        await symEncryptedPacket.decrypt(algo, data, config$1);
      } catch (e) {
        util.printDebugError(e);
        exception = e;
      }
    }));
    cancel(symEncryptedPacket.encrypted);
    symEncryptedPacket.encrypted = null;
    await decryptedPromise;
    if (!symEncryptedPacket.packets || !symEncryptedPacket.packets.length) {
      throw exception || new Error("Decryption failed.");
    }
    const resultMsg = new _Message(symEncryptedPacket.packets);
    symEncryptedPacket.packets = new PacketList();
    return resultMsg;
  }
  /**
   * Decrypt encrypted session keys either with private keys or passwords.
   * @param {Array<PrivateKey>} [decryptionKeys] - Private keys with decrypted secret data
   * @param {Array<String>} [passwords] - Passwords used to decrypt
   * @param {enums.symmetric} [expectedSymmetricAlgorithm] - The symmetric algorithm the SEIPDv2 / AEAD packet is encrypted with (if applicable)
   * @param {Date} [date] - Use the given date for key verification, instead of current time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<{
   *   data: Uint8Array,
   *   algorithm: String
   * }>>} array of object with potential sessionKey, algorithm pairs
   * @async
   */
  async decryptSessionKeys(decryptionKeys, passwords, expectedSymmetricAlgorithm, date = /* @__PURE__ */ new Date(), config$1 = config) {
    let decryptedSessionKeyPackets = [];
    let exception;
    if (passwords) {
      const skeskPackets = this.packets.filterByTag(enums.packet.symEncryptedSessionKey);
      if (skeskPackets.length === 0) {
        throw new Error("No symmetrically encrypted session key packet found.");
      }
      await Promise.all(passwords.map(async function(password, i) {
        let packets;
        if (i) {
          packets = await PacketList.fromBinary(skeskPackets.write(), allowedSymSessionKeyPackets, config$1);
        } else {
          packets = skeskPackets;
        }
        await Promise.all(packets.map(async function(skeskPacket) {
          try {
            await skeskPacket.decrypt(password);
            decryptedSessionKeyPackets.push(skeskPacket);
          } catch (err2) {
            util.printDebugError(err2);
            if (err2 instanceof Argon2OutOfMemoryError) {
              exception = err2;
            }
          }
        }));
      }));
    } else if (decryptionKeys) {
      const pkeskPackets = this.packets.filterByTag(enums.packet.publicKeyEncryptedSessionKey);
      if (pkeskPackets.length === 0) {
        throw new Error("No public key encrypted session key packet found.");
      }
      await Promise.all(pkeskPackets.map(async function(pkeskPacket) {
        await Promise.all(decryptionKeys.map(async function(decryptionKey) {
          let decryptionKeyPackets;
          try {
            decryptionKeyPackets = (await decryptionKey.getDecryptionKeys(pkeskPacket.publicKeyID, null, void 0, config$1)).map((key) => key.keyPacket);
          } catch (err2) {
            exception = err2;
            return;
          }
          let algos = [
            enums.symmetric.aes256,
            // Old OpenPGP.js default fallback
            enums.symmetric.aes128,
            // RFC4880bis fallback
            enums.symmetric.tripledes,
            // RFC4880 fallback
            enums.symmetric.cast5
            // Golang OpenPGP fallback
          ];
          try {
            const selfCertification = await decryptionKey.getPrimarySelfSignature(date, void 0, config$1);
            if (selfCertification.preferredSymmetricAlgorithms) {
              algos = algos.concat(selfCertification.preferredSymmetricAlgorithms);
            }
          } catch (e) {
          }
          await Promise.all(decryptionKeyPackets.map(async function(decryptionKeyPacket) {
            if (!decryptionKeyPacket.isDecrypted()) {
              throw new Error("Decryption key is not decrypted.");
            }
            const doConstantTimeDecryption = config$1.constantTimePKCS1Decryption && (pkeskPacket.publicKeyAlgorithm === enums.publicKey.rsaEncrypt || pkeskPacket.publicKeyAlgorithm === enums.publicKey.rsaEncryptSign || pkeskPacket.publicKeyAlgorithm === enums.publicKey.rsaSign || pkeskPacket.publicKeyAlgorithm === enums.publicKey.elgamal);
            if (doConstantTimeDecryption) {
              const serialisedPKESK = pkeskPacket.write();
              await Promise.all((expectedSymmetricAlgorithm ? [expectedSymmetricAlgorithm] : Array.from(config$1.constantTimePKCS1DecryptionSupportedSymmetricAlgorithms)).map(async (sessionKeyAlgorithm) => {
                const pkeskPacketCopy = new PublicKeyEncryptedSessionKeyPacket();
                pkeskPacketCopy.read(serialisedPKESK);
                const randomSessionKey = {
                  sessionKeyAlgorithm,
                  sessionKey: generateSessionKey$1(sessionKeyAlgorithm)
                };
                try {
                  await pkeskPacketCopy.decrypt(decryptionKeyPacket, randomSessionKey);
                  decryptedSessionKeyPackets.push(pkeskPacketCopy);
                } catch (err2) {
                  util.printDebugError(err2);
                  exception = err2;
                }
              }));
            } else {
              try {
                await pkeskPacket.decrypt(decryptionKeyPacket);
                const symmetricAlgorithm = expectedSymmetricAlgorithm || pkeskPacket.sessionKeyAlgorithm;
                if (symmetricAlgorithm && !algos.includes(enums.write(enums.symmetric, symmetricAlgorithm))) {
                  throw new Error("A non-preferred symmetric algorithm was used.");
                }
                decryptedSessionKeyPackets.push(pkeskPacket);
              } catch (err2) {
                util.printDebugError(err2);
                exception = err2;
              }
            }
          }));
        }));
        cancel(pkeskPacket.encrypted);
        pkeskPacket.encrypted = null;
      }));
    } else {
      throw new Error("No key or password specified.");
    }
    if (decryptedSessionKeyPackets.length > 0) {
      if (decryptedSessionKeyPackets.length > 1) {
        const seen = /* @__PURE__ */ new Set();
        decryptedSessionKeyPackets = decryptedSessionKeyPackets.filter((item) => {
          const k = item.sessionKeyAlgorithm + util.uint8ArrayToString(item.sessionKey);
          if (seen.has(k)) {
            return false;
          }
          seen.add(k);
          return true;
        });
      }
      return decryptedSessionKeyPackets.map((packet) => ({
        data: packet.sessionKey,
        algorithm: packet.sessionKeyAlgorithm && enums.read(enums.symmetric, packet.sessionKeyAlgorithm)
      }));
    }
    throw exception || new Error("Session key decryption failed.");
  }
  /**
   * Get literal data that is the body of the message
   * @returns {(Uint8Array|null)} Literal body of the message as Uint8Array.
   */
  getLiteralData() {
    const msg = this.unwrapCompressed();
    const literal = msg.packets.findPacket(enums.packet.literalData);
    return literal && literal.getBytes() || null;
  }
  /**
   * Get filename from literal data packet
   * @returns {(String|null)} Filename of literal data packet as string.
   */
  getFilename() {
    const msg = this.unwrapCompressed();
    const literal = msg.packets.findPacket(enums.packet.literalData);
    return literal && literal.getFilename() || null;
  }
  /**
   * Get literal data as text
   * @returns {(String|null)} Literal body of the message interpreted as text.
   */
  getText() {
    const msg = this.unwrapCompressed();
    const literal = msg.packets.findPacket(enums.packet.literalData);
    if (literal) {
      return literal.getText();
    }
    return null;
  }
  /**
   * Generate a new session key object, taking the algorithm preferences of the passed encryption keys into account, if any.
   * @param {Array<PublicKey>} [encryptionKeys] - Public key(s) to select algorithm preferences for
   * @param {Date} [date] - Date to select algorithm preferences at
   * @param {Array<Object>} [userIDs] - User IDs to select algorithm preferences for
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<{ data: Uint8Array, algorithm: String, aeadAlgorithm: undefined|String }>} Object with session key data and algorithms.
   * @async
   */
  static async generateSessionKey(encryptionKeys = [], date = /* @__PURE__ */ new Date(), userIDs = [], config$1 = config) {
    const { symmetricAlgo, aeadAlgo } = await getPreferredCipherSuite(encryptionKeys, date, userIDs, config$1);
    const symmetricAlgoName = enums.read(enums.symmetric, symmetricAlgo);
    const aeadAlgoName = aeadAlgo ? enums.read(enums.aead, aeadAlgo) : void 0;
    await Promise.all(encryptionKeys.map(
      (key) => key.getEncryptionKey().catch(() => null).then((maybeKey) => {
        if (maybeKey && (maybeKey.keyPacket.algorithm === enums.publicKey.x25519 || maybeKey.keyPacket.algorithm === enums.publicKey.x448) && !aeadAlgoName && !util.isAES(symmetricAlgo)) {
          throw new Error("Could not generate a session key compatible with the given `encryptionKeys`: X22519 and X448 keys can only be used to encrypt AES session keys; change `config.preferredSymmetricAlgorithm` accordingly.");
        }
      })
    ));
    const sessionKeyData = generateSessionKey$1(symmetricAlgo);
    return { data: sessionKeyData, algorithm: symmetricAlgoName, aeadAlgorithm: aeadAlgoName };
  }
  /**
   * Encrypt the message either with public keys, passwords, or both at once.
   * @param {Array<PublicKey>} [encryptionKeys] - Public key(s) for message encryption
   * @param {Array<String>} [passwords] - Password(s) for message encryption
   * @param {Object} [sessionKey] - Session key in the form: { data:Uint8Array, algorithm:String, [aeadAlgorithm:String] }
   * @param {Boolean} [wildcard] - Use a key ID of 0 instead of the public key IDs
   * @param {Array<module:type/keyid~KeyID>} [encryptionKeyIDs] - Array of key IDs to use for encryption. Each encryptionKeyIDs[i] corresponds to keys[i]
   * @param {Date} [date] - Override the creation date of the literal package
   * @param {Array<Object>} [userIDs] - User IDs to encrypt for, e.g. [{ name:'Robert Receiver', email:'robert@openpgp.org' }]
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Message>} New message with encrypted content.
   * @async
   */
  async encrypt(encryptionKeys, passwords, sessionKey, wildcard = false, encryptionKeyIDs = [], date = /* @__PURE__ */ new Date(), userIDs = [], config$1 = config) {
    if (sessionKey) {
      if (!util.isUint8Array(sessionKey.data) || !util.isString(sessionKey.algorithm)) {
        throw new Error("Invalid session key for encryption.");
      }
    } else if (encryptionKeys && encryptionKeys.length) {
      sessionKey = await _Message.generateSessionKey(encryptionKeys, date, userIDs, config$1);
    } else if (passwords && passwords.length) {
      sessionKey = await _Message.generateSessionKey(void 0, void 0, void 0, config$1);
    } else {
      throw new Error("No keys, passwords, or session key provided.");
    }
    const { data: sessionKeyData, algorithm: algorithmName, aeadAlgorithm: aeadAlgorithmName } = sessionKey;
    const msg = await _Message.encryptSessionKey(sessionKeyData, algorithmName, aeadAlgorithmName, encryptionKeys, passwords, wildcard, encryptionKeyIDs, date, userIDs, config$1);
    const symEncryptedPacket = SymEncryptedIntegrityProtectedDataPacket.fromObject({
      version: aeadAlgorithmName ? 2 : 1,
      aeadAlgorithm: aeadAlgorithmName ? enums.write(enums.aead, aeadAlgorithmName) : null
    });
    symEncryptedPacket.packets = this.packets;
    const algorithm = enums.write(enums.symmetric, algorithmName);
    await symEncryptedPacket.encrypt(algorithm, sessionKeyData, config$1);
    msg.packets.push(symEncryptedPacket);
    symEncryptedPacket.packets = new PacketList();
    return msg;
  }
  /**
   * Encrypt a session key either with public keys, passwords, or both at once.
   * @param {Uint8Array} sessionKey - session key for encryption
   * @param {String} algorithmName - session key algorithm
   * @param {String} [aeadAlgorithmName] - AEAD algorithm, e.g. 'eax' or 'ocb'
   * @param {Array<PublicKey>} [encryptionKeys] - Public key(s) for message encryption
   * @param {Array<String>} [passwords] - For message encryption
   * @param {Boolean} [wildcard] - Use a key ID of 0 instead of the public key IDs
   * @param {Array<module:type/keyid~KeyID>} [encryptionKeyIDs] - Array of key IDs to use for encryption. Each encryptionKeyIDs[i] corresponds to encryptionKeys[i]
   * @param {Date} [date] - Override the date
   * @param {Array} [userIDs] - User IDs to encrypt for, e.g. [{ name:'Robert Receiver', email:'robert@openpgp.org' }]
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Message>} New message with encrypted content.
   * @async
   */
  static async encryptSessionKey(sessionKey, algorithmName, aeadAlgorithmName, encryptionKeys, passwords, wildcard = false, encryptionKeyIDs = [], date = /* @__PURE__ */ new Date(), userIDs = [], config$1 = config) {
    const packetlist = new PacketList();
    const symmetricAlgorithm = enums.write(enums.symmetric, algorithmName);
    const aeadAlgorithm = aeadAlgorithmName && enums.write(enums.aead, aeadAlgorithmName);
    if (encryptionKeys) {
      const results = await Promise.all(encryptionKeys.map(async function(primaryKey, i) {
        const encryptionKey = await primaryKey.getEncryptionKey(encryptionKeyIDs[i], date, userIDs, config$1);
        const pkESKeyPacket = PublicKeyEncryptedSessionKeyPacket.fromObject({
          version: aeadAlgorithm ? 6 : 3,
          encryptionKeyPacket: encryptionKey.keyPacket,
          anonymousRecipient: wildcard,
          sessionKey,
          sessionKeyAlgorithm: symmetricAlgorithm
        });
        await pkESKeyPacket.encrypt(encryptionKey.keyPacket);
        delete pkESKeyPacket.sessionKey;
        return pkESKeyPacket;
      }));
      packetlist.push(...results);
    }
    if (passwords) {
      const testDecrypt = async function(keyPacket, password) {
        try {
          await keyPacket.decrypt(password);
          return 1;
        } catch (e) {
          return 0;
        }
      };
      const sum = (accumulator, currentValue) => accumulator + currentValue;
      const encryptPassword = async function(sessionKey2, algorithm, aeadAlgorithm2, password) {
        const symEncryptedSessionKeyPacket = new SymEncryptedSessionKeyPacket(config$1);
        symEncryptedSessionKeyPacket.sessionKey = sessionKey2;
        symEncryptedSessionKeyPacket.sessionKeyAlgorithm = algorithm;
        if (aeadAlgorithm2) {
          symEncryptedSessionKeyPacket.aeadAlgorithm = aeadAlgorithm2;
        }
        await symEncryptedSessionKeyPacket.encrypt(password, config$1);
        if (config$1.passwordCollisionCheck) {
          const results2 = await Promise.all(passwords.map((pwd) => testDecrypt(symEncryptedSessionKeyPacket, pwd)));
          if (results2.reduce(sum) !== 1) {
            return encryptPassword(sessionKey2, algorithm, password);
          }
        }
        delete symEncryptedSessionKeyPacket.sessionKey;
        return symEncryptedSessionKeyPacket;
      };
      const results = await Promise.all(passwords.map((pwd) => encryptPassword(sessionKey, symmetricAlgorithm, aeadAlgorithm, pwd)));
      packetlist.push(...results);
    }
    return new _Message(packetlist);
  }
  /**
   * Sign the message (the literal data packet of the message)
   * @param {Array<PrivateKey>} signingKeys - private keys with decrypted secret key data for signing
   * @param {Array<Key>} recipientKeys - recipient keys to get the signing preferences from
   * @param {Signature} [signature] - Any existing detached signature to add to the message
   * @param {Array<module:type/keyid~KeyID>} [signingKeyIDs] - Array of key IDs to use for signing. Each signingKeyIDs[i] corresponds to signingKeys[i]
   * @param {Date} [date] - Override the creation time of the signature
   * @param {Array<UserID>} [signingUserIDs] - User IDs to sign with, e.g. [{ name:'Steve Sender', email:'steve@openpgp.org' }]
   * @param {Array<UserID>} [recipientUserIDs] - User IDs associated with `recipientKeys` to get the signing preferences from
   * @param {Array} [notations] - Notation Data to add to the signatures, e.g. [{ name: 'test@example.org', value: new TextEncoder().encode('test'), humanReadable: true, critical: false }]
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Message>} New message with signed content.
   * @async
   */
  async sign(signingKeys = [], recipientKeys = [], signature = null, signingKeyIDs = [], date = /* @__PURE__ */ new Date(), signingUserIDs = [], recipientUserIDs = [], notations = [], config$1 = config) {
    const packetlist = new PacketList();
    const literalDataPacket = this.packets.findPacket(enums.packet.literalData);
    if (!literalDataPacket) {
      throw new Error("No literal data packet to sign.");
    }
    const signaturePackets = await createSignaturePackets(literalDataPacket, signingKeys, recipientKeys, signature, signingKeyIDs, date, signingUserIDs, recipientUserIDs, notations, false, config$1);
    const onePassSignaturePackets = signaturePackets.map(
      (signaturePacket, i) => OnePassSignaturePacket.fromSignaturePacket(signaturePacket, i === 0)
    ).reverse();
    packetlist.push(...onePassSignaturePackets);
    packetlist.push(literalDataPacket);
    packetlist.push(...signaturePackets);
    return new _Message(packetlist);
  }
  /**
   * Compresses the message (the literal and -if signed- signature data packets of the message)
   * @param {module:enums.compression} algo - compression algorithm
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Message} New message with compressed content.
   */
  compress(algo, config$1 = config) {
    if (algo === enums.compression.uncompressed) {
      return this;
    }
    const compressed = new CompressedDataPacket(config$1);
    compressed.algorithm = algo;
    compressed.packets = this.packets;
    const packetList = new PacketList();
    packetList.push(compressed);
    return new _Message(packetList);
  }
  /**
   * Create a detached signature for the message (the literal data packet of the message)
   * @param {Array<PrivateKey>} signingKeys - private keys with decrypted secret key data for signing
   * @param {Array<Key>} recipientKeys - recipient keys to get the signing preferences from
   * @param {Signature} [signature] - Any existing detached signature
   * @param {Array<module:type/keyid~KeyID>} [signingKeyIDs] - Array of key IDs to use for signing. Each signingKeyIDs[i] corresponds to signingKeys[i]
   * @param {Date} [date] - Override the creation time of the signature
   * @param {Array<UserID>} [signingUserIDs] - User IDs to sign with, e.g. [{ name:'Steve Sender', email:'steve@openpgp.org' }]
   * @param {Array<UserID>} [recipientUserIDs] - User IDs associated with `recipientKeys` to get the signing preferences from
   * @param {Array} [notations] - Notation Data to add to the signatures, e.g. [{ name: 'test@example.org', value: new TextEncoder().encode('test'), humanReadable: true, critical: false }]
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Signature>} New detached signature of message content.
   * @async
   */
  async signDetached(signingKeys = [], recipientKeys = [], signature = null, signingKeyIDs = [], recipientKeyIDs = [], date = /* @__PURE__ */ new Date(), userIDs = [], notations = [], config$1 = config) {
    const literalDataPacket = this.packets.findPacket(enums.packet.literalData);
    if (!literalDataPacket) {
      throw new Error("No literal data packet to sign.");
    }
    return new Signature(await createSignaturePackets(literalDataPacket, signingKeys, recipientKeys, signature, signingKeyIDs, recipientKeyIDs, date, userIDs, notations, true, config$1));
  }
  /**
   * Verify message signatures
   * @param {Array<PublicKey>} verificationKeys - Array of public keys to verify signatures
   * @param {Date} [date] - Verify the signature against the given date, i.e. check signature creation time < date < expiration time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<{
   *   keyID: module:type/keyid~KeyID,
   *   signature: Promise<Signature>,
   *   verified: Promise<true>
   * }>>} List of signer's keyID and validity of signatures.
   * @async
   */
  async verify(verificationKeys, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const msg = this.unwrapCompressed();
    const literalDataList = msg.packets.filterByTag(enums.packet.literalData);
    if (literalDataList.length !== 1) {
      throw new Error("Can only verify message with one literal data packet.");
    }
    if (isArrayStream(msg.packets.stream)) {
      msg.packets.push(...await readToEnd(msg.packets.stream, (_) => _ || []));
    }
    const onePassSigList = msg.packets.filterByTag(enums.packet.onePassSignature).reverse();
    const signatureList = msg.packets.filterByTag(enums.packet.signature);
    if (onePassSigList.length && !signatureList.length && util.isStream(msg.packets.stream) && !isArrayStream(msg.packets.stream)) {
      await Promise.all(onePassSigList.map(async (onePassSig) => {
        onePassSig.correspondingSig = new Promise((resolve2, reject) => {
          onePassSig.correspondingSigResolve = resolve2;
          onePassSig.correspondingSigReject = reject;
        });
        onePassSig.signatureData = fromAsync(async () => (await onePassSig.correspondingSig).signatureData);
        onePassSig.hashed = readToEnd(await onePassSig.hash(onePassSig.signatureType, literalDataList[0], void 0, false));
        onePassSig.hashed.catch(() => {
        });
      }));
      msg.packets.stream = transformPair(msg.packets.stream, async (readable, writable) => {
        const reader = getReader(readable);
        const writer = getWriter(writable);
        try {
          for (let i = 0; i < onePassSigList.length; i++) {
            const { value: signature } = await reader.read();
            onePassSigList[i].correspondingSigResolve(signature);
          }
          await reader.readToEnd();
          await writer.ready;
          await writer.close();
        } catch (e) {
          onePassSigList.forEach((onePassSig) => {
            onePassSig.correspondingSigReject(e);
          });
          await writer.abort(e);
        }
      });
      return createVerificationObjects(onePassSigList, literalDataList, verificationKeys, date, false, config$1);
    }
    return createVerificationObjects(signatureList, literalDataList, verificationKeys, date, false, config$1);
  }
  /**
   * Verify detached message signature
   * @param {Array<PublicKey>} verificationKeys - Array of public keys to verify signatures
   * @param {Signature} signature
   * @param {Date} date - Verify the signature against the given date, i.e. check signature creation time < date < expiration time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<{
   *   keyID: module:type/keyid~KeyID,
   *   signature: Promise<Signature>,
   *   verified: Promise<true>
   * }>>} List of signer's keyID and validity of signature.
   * @async
   */
  verifyDetached(signature, verificationKeys, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const msg = this.unwrapCompressed();
    const literalDataList = msg.packets.filterByTag(enums.packet.literalData);
    if (literalDataList.length !== 1) {
      throw new Error("Can only verify message with one literal data packet.");
    }
    const signatureList = signature.packets.filterByTag(enums.packet.signature);
    return createVerificationObjects(signatureList, literalDataList, verificationKeys, date, true, config$1);
  }
  /**
   * Unwrap compressed message
   * @returns {Message} Message Content of compressed message.
   */
  unwrapCompressed() {
    const compressed = this.packets.filterByTag(enums.packet.compressedData);
    if (compressed.length) {
      return new _Message(compressed[0].packets);
    }
    return this;
  }
  /**
   * Append signature to unencrypted message object
   * @param {String|Uint8Array} detachedSignature - The detached ASCII-armored or Uint8Array PGP signature
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  async appendSignature(detachedSignature, config$1 = config) {
    await this.packets.read(
      util.isUint8Array(detachedSignature) ? detachedSignature : (await unarmor(detachedSignature)).data,
      allowedDetachedSignaturePackets,
      config$1
    );
  }
  /**
   * Returns binary encoded message
   * @returns {ReadableStream<Uint8Array>} Binary message.
   */
  write() {
    return this.packets.write();
  }
  /**
   * Returns ASCII armored text of message
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {ReadableStream<String>} ASCII armor.
   */
  armor(config$1 = config) {
    const trailingPacket = this.packets[this.packets.length - 1];
    const emitChecksum = trailingPacket.constructor.tag === SymEncryptedIntegrityProtectedDataPacket.tag ? trailingPacket.version !== 2 : this.packets.some((packet) => packet.constructor.tag === SignaturePacket.tag && packet.version !== 6);
    return armor(enums.armor.message, this.write(), null, null, null, emitChecksum, config$1);
  }
};
async function createSignaturePackets(literalDataPacket, signingKeys, recipientKeys = [], signature = null, signingKeyIDs = [], date = /* @__PURE__ */ new Date(), signingUserIDs = [], recipientUserIDs = [], notations = [], detached = false, config$1 = config) {
  const packetlist = new PacketList();
  const signatureType = literalDataPacket.text === null ? enums.signature.binary : enums.signature.text;
  await Promise.all(signingKeys.map(async (primaryKey, i) => {
    const signingUserID = signingUserIDs[i];
    if (!primaryKey.isPrivate()) {
      throw new Error("Need private key for signing");
    }
    const signingKey = await primaryKey.getSigningKey(signingKeyIDs[i], date, signingUserID, config$1);
    return createSignaturePacket(literalDataPacket, recipientKeys.length ? recipientKeys : [primaryKey], signingKey.keyPacket, { signatureType }, date, recipientUserIDs, notations, detached, config$1);
  })).then((signatureList) => {
    packetlist.push(...signatureList);
  });
  if (signature) {
    const existingSigPacketlist = signature.packets.filterByTag(enums.packet.signature);
    packetlist.push(...existingSigPacketlist);
  }
  return packetlist;
}
async function createVerificationObject(signature, literalDataList, verificationKeys, date = /* @__PURE__ */ new Date(), detached = false, config$1 = config) {
  let primaryKey;
  let unverifiedSigningKey;
  for (const key of verificationKeys) {
    const issuerKeys = key.getKeys(signature.issuerKeyID);
    if (issuerKeys.length > 0) {
      primaryKey = key;
      unverifiedSigningKey = issuerKeys[0];
      break;
    }
  }
  const isOnePassSignature = signature instanceof OnePassSignaturePacket;
  const signaturePacketPromise = isOnePassSignature ? signature.correspondingSig : signature;
  const verifiedSig = {
    keyID: signature.issuerKeyID,
    verified: (async () => {
      if (!unverifiedSigningKey) {
        throw new Error(`Could not find signing key with key ID ${signature.issuerKeyID.toHex()}`);
      }
      await signature.verify(unverifiedSigningKey.keyPacket, signature.signatureType, literalDataList[0], date, detached, config$1);
      const signaturePacket = await signaturePacketPromise;
      if (unverifiedSigningKey.getCreationTime() > signaturePacket.created) {
        throw new Error("Key is newer than the signature");
      }
      try {
        await primaryKey.getSigningKey(unverifiedSigningKey.getKeyID(), signaturePacket.created, void 0, config$1);
      } catch (e) {
        if (config$1.allowInsecureVerificationWithReformattedKeys && e.message.match(/Signature creation time is in the future/)) {
          await primaryKey.getSigningKey(unverifiedSigningKey.getKeyID(), date, void 0, config$1);
        } else {
          throw e;
        }
      }
      return true;
    })(),
    signature: (async () => {
      const signaturePacket = await signaturePacketPromise;
      const packetlist = new PacketList();
      signaturePacket && packetlist.push(signaturePacket);
      return new Signature(packetlist);
    })()
  };
  verifiedSig.signature.catch(() => {
  });
  verifiedSig.verified.catch(() => {
  });
  return verifiedSig;
}
async function createVerificationObjects(signatureList, literalDataList, verificationKeys, date = /* @__PURE__ */ new Date(), detached = false, config$1 = config) {
  return Promise.all(signatureList.filter(function(signature) {
    return ["text", "binary"].includes(enums.read(enums.signature, signature.signatureType));
  }).map(async function(signature) {
    return createVerificationObject(signature, literalDataList, verificationKeys, date, detached, config$1);
  }));
}
async function createMessage({ text, binary, filename, date = /* @__PURE__ */ new Date(), format = text !== void 0 ? "utf8" : "binary", ...rest }) {
  const input = text !== void 0 ? text : binary;
  if (input === void 0) {
    throw new Error("createMessage: must pass options object containing `text` or `binary`");
  }
  if (text && !util.isString(text) && !util.isStream(text)) {
    throw new Error("createMessage: options.text must be a string or stream");
  }
  if (binary && !util.isUint8Array(binary) && !util.isStream(binary)) {
    throw new Error("createMessage: options.binary must be a Uint8Array or stream");
  }
  const unknownOptions = Object.keys(rest);
  if (unknownOptions.length > 0) throw new Error(`Unknown option: ${unknownOptions.join(", ")}`);
  const streamType = util.isStream(input);
  const literalDataPacket = new LiteralDataPacket(date);
  if (text !== void 0) {
    literalDataPacket.setText(input, enums.write(enums.literal, format));
  } else {
    literalDataPacket.setBytes(input, enums.write(enums.literal, format));
  }
  if (filename !== void 0) {
    literalDataPacket.setFilename(filename);
  }
  const literalDataPacketlist = new PacketList();
  literalDataPacketlist.push(literalDataPacket);
  const message = new Message(literalDataPacketlist);
  message.fromStream = streamType;
  return message;
}
var CleartextMessage = class _CleartextMessage {
  /**
   * @param {String} text - The cleartext of the signed message
   * @param {Signature} signature - The detached signature or an empty signature for unsigned messages
   */
  constructor(text, signature) {
    this.text = util.removeTrailingSpaces(text).replace(/\r?\n/g, "\r\n");
    if (signature && !(signature instanceof Signature)) {
      throw new Error("Invalid signature input");
    }
    this.signature = signature || new Signature(new PacketList());
  }
  /**
   * Returns the key IDs of the keys that signed the cleartext message
   * @returns {Array<module:type/keyid~KeyID>} Array of keyID objects.
   */
  getSigningKeyIDs() {
    const keyIDs = [];
    const signatureList = this.signature.packets;
    signatureList.forEach(function(packet) {
      keyIDs.push(packet.issuerKeyID);
    });
    return keyIDs;
  }
  /**
   * Sign the cleartext message
   * @param {Array<Key>} signingKeys - private keys with decrypted secret key data for signing
   * @param {Array<Key>} recipientKeys - recipient keys to get the signing preferences from
   * @param {Signature} [signature] - Any existing detached signature
   * @param {Array<module:type/keyid~KeyID>} [signingKeyIDs] - Array of key IDs to use for signing. Each signingKeyIDs[i] corresponds to privateKeys[i]
   * @param {Date} [date] - The creation time of the signature that should be created
   * @param {Array} [signingKeyIDs] - User IDs to sign with, e.g. [{ name:'Steve Sender', email:'steve@openpgp.org' }]
   * @param {Array} [recipientUserIDs] - User IDs associated with `recipientKeys` to get the signing preferences from
   * @param {Array} [notations] - Notation Data to add to the signatures, e.g. [{ name: 'test@example.org', value: new TextEncoder().encode('test'), humanReadable: true, critical: false }]
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<CleartextMessage>} New cleartext message with signed content.
   * @async
   */
  async sign(signingKeys, recipientKeys = [], signature = null, signingKeyIDs = [], date = /* @__PURE__ */ new Date(), signingUserIDs = [], recipientUserIDs = [], notations = [], config$1 = config) {
    const literalDataPacket = new LiteralDataPacket();
    literalDataPacket.setText(this.text);
    const newSignature = new Signature(await createSignaturePackets(literalDataPacket, signingKeys, recipientKeys, signature, signingKeyIDs, date, signingUserIDs, recipientUserIDs, notations, true, config$1));
    return new _CleartextMessage(this.text, newSignature);
  }
  /**
   * Verify signatures of cleartext signed message
   * @param {Array<Key>} keys - Array of keys to verify signatures
   * @param {Date} [date] - Verify the signature against the given date, i.e. check signature creation time < date < expiration time
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {Promise<Array<{
   *   keyID: module:type/keyid~KeyID,
   *   signature: Promise<Signature>,
   *   verified: Promise<true>
   * }>>} List of signer's keyID and validity of signature.
   * @async
   */
  verify(keys, date = /* @__PURE__ */ new Date(), config$1 = config) {
    const signatureList = this.signature.packets.filterByTag(enums.packet.signature);
    const literalDataPacket = new LiteralDataPacket();
    literalDataPacket.setText(this.text);
    return createVerificationObjects(signatureList, [literalDataPacket], keys, date, true, config$1);
  }
  /**
   * Get cleartext
   * @returns {String} Cleartext of message.
   */
  getText() {
    return this.text.replace(/\r\n/g, "\n");
  }
  /**
   * Returns ASCII armored text of cleartext signed message
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   * @returns {String | ReadableStream<String>} ASCII armor.
   */
  armor(config$1 = config) {
    const emitHeaderAndChecksum = this.signature.packets.some((packet) => packet.version !== 6);
    const hash2 = emitHeaderAndChecksum ? Array.from(new Set(this.signature.packets.map(
      (packet) => enums.read(enums.hash, packet.hashAlgorithm).toUpperCase()
    ))).join() : null;
    const body = {
      hash: hash2,
      text: this.text,
      data: this.signature.packets.write()
    };
    return armor(enums.armor.signed, body, void 0, void 0, void 0, emitHeaderAndChecksum, config$1);
  }
};
async function verify({ message, verificationKeys, expectSigned = false, format = "utf8", signature = null, date = /* @__PURE__ */ new Date(), config: config$1, ...rest }) {
  config$1 = { ...config, ...config$1 };
  checkConfig(config$1);
  checkCleartextOrMessage(message);
  verificationKeys = toArray(verificationKeys);
  if (rest.publicKeys) throw new Error("The `publicKeys` option has been removed from openpgp.verify, pass `verificationKeys` instead");
  const unknownOptions = Object.keys(rest);
  if (unknownOptions.length > 0) throw new Error(`Unknown option: ${unknownOptions.join(", ")}`);
  if (message instanceof CleartextMessage && format === "binary") throw new Error("Can't return cleartext message data as binary");
  if (message instanceof CleartextMessage && signature) throw new Error("Can't verify detached cleartext signature");
  try {
    const result = {};
    if (signature) {
      result.signatures = await message.verifyDetached(signature, verificationKeys, date, config$1);
    } else {
      result.signatures = await message.verify(verificationKeys, date, config$1);
    }
    result.data = format === "binary" ? message.getLiteralData() : message.getText();
    if (message.fromStream && !signature) linkStreams(result, message);
    if (expectSigned) {
      if (result.signatures.length === 0) {
        throw new Error("Message is not signed");
      }
      result.data = concat([
        result.data,
        fromAsync(async () => {
          await util.anyPromise(result.signatures.map((sig) => sig.verified));
          return format === "binary" ? new Uint8Array() : "";
        })
      ]);
    }
    result.data = await convertStream(result.data);
    return result;
  } catch (err2) {
    throw util.wrapError("Error verifying signed message", err2);
  }
}
function checkCleartextOrMessage(message) {
  if (!(message instanceof CleartextMessage) && !(message instanceof Message)) {
    throw new Error("Parameter [message] needs to be of type Message or CleartextMessage");
  }
}
var defaultConfigPropsCount = Object.keys(config).length;
function checkConfig(config$1) {
  const inputConfigProps = Object.keys(config$1);
  if (inputConfigProps.length !== defaultConfigPropsCount) {
    for (const inputProp of inputConfigProps) {
      if (config[inputProp] === void 0) {
        throw new Error(`Unknown config property: ${inputProp}`);
      }
    }
  }
}
function toArray(param) {
  if (param && !util.isArray(param)) {
    param = [param];
  }
  return param;
}
async function convertStream(data) {
  const streamType = util.isStream(data);
  if (streamType === "array") {
    return readToEnd(data);
  }
  return data;
}
function linkStreams(result, message) {
  result.data = transformPair(message.packets.stream, async (readable, writable) => {
    await pipe(result.data, writable, {
      preventClose: true
    });
    const writer = getWriter(writable);
    try {
      await readToEnd(readable, (_) => _);
      await writer.close();
    } catch (e) {
      await writer.abort(e);
    }
  });
}
function number(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`positive integer expected, not ${n}`);
}
function isBytes$1(a) {
  return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
}
function bytes(b, ...lengths) {
  if (!isBytes$1(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
}
function hash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.wrapConstructor");
  number(h.outputLen);
  number(h.blockLen);
}
function exists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
  bytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error(`digestInto() expects output buffer of length at least ${min}`);
  }
}
var crypto$1 = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : nc && typeof nc === "object" && "randomBytes" in nc ? nc : void 0;
var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var rotr = (word, shift) => word << 32 - shift | word >>> shift;
var rotl = (word, shift) => word << shift | word >>> 32 - shift >>> 0;
var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
var byteSwap = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
}
function utf8ToBytes$1(str) {
  if (typeof str !== "string")
    throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes$1(data);
  bytes(data);
  return data;
}
function concatBytes$1(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    bytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad2 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad2);
    pad2 += a.length;
  }
  return res;
}
var Hash = class {
  // Safe version that clones internal state
  clone() {
    return this._cloneInto();
  }
};
function wrapConstructor(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function wrapXOFConstructorWithOpts(hashCons) {
  const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
  const tmp = hashCons({});
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  return hashC;
}
function randomBytes2(bytesLength = 32) {
  if (crypto$1 && typeof crypto$1.getRandomValues === "function") {
    return crypto$1.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto$1 && typeof crypto$1.randomBytes === "function") {
    return crypto$1.randomBytes(bytesLength);
  }
  throw new Error("crypto.getRandomValues must be defined");
}
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}
var Chi$1 = (a, b, c) => a & b ^ ~a & c;
var Maj = (a, b, c) => a & b ^ a & c ^ b & c;
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE2) {
    super();
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    exists(this);
    const { view, buffer, blockLen } = this;
    data = toBytes(data);
    const len = data.length;
    for (let pos2 = 0; pos2 < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos2);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos2; pos2 += blockLen)
          this.process(dataView, pos2);
        continue;
      }
      buffer.set(data.subarray(pos2, pos2 + take), this.pos);
      this.pos += take;
      pos2 += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    exists(this);
    output(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos: pos2 } = this;
    buffer[pos2++] = 128;
    this.buffer.subarray(pos2).fill(0);
    if (this.padOffset > blockLen - pos2) {
      this.process(view, 0);
      pos2 = 0;
    }
    for (let i = pos2; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos: pos2 } = this;
    to.length = length;
    to.pos = pos2;
    to.finished = finished;
    to.destroyed = destroyed;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
};
var SHA256_K = /* @__PURE__ */ new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_IV = /* @__PURE__ */ new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor() {
    super(64, 32, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A: A2, B, C, D: D3, E, F, G: G3, H } = this;
    return [A2, B, C, D3, E, F, G3, H];
  }
  // prettier-ignore
  set(A2, B, C, D3, E, F, G3, H) {
    this.A = A2 | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D3 | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G3 | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A: A2, B, C, D: D3, E, F, G: G3, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi$1(E, F, G3) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A2, 2) ^ rotr(A2, 13) ^ rotr(A2, 22);
      const T2 = sigma0 + Maj(A2, B, C) | 0;
      H = G3;
      G3 = F;
      F = E;
      E = D3 + T1 | 0;
      D3 = C;
      C = B;
      B = A2;
      A2 = T1 + T2 | 0;
    }
    A2 = A2 + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D3 = D3 + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G3 = G3 + this.G | 0;
    H = H + this.H | 0;
    this.set(A2, B, C, D3, E, F, G3, H);
  }
  roundClean() {
    SHA256_W.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    this.buffer.fill(0);
  }
};
var SHA224 = class extends SHA256 {
  constructor() {
    super();
    this.A = 3238371032 | 0;
    this.B = 914150663 | 0;
    this.C = 812702999 | 0;
    this.D = 4144912697 | 0;
    this.E = 4290775857 | 0;
    this.F = 1750603025 | 0;
    this.G = 1694076839 | 0;
    this.H = 3204075428 | 0;
    this.outputLen = 28;
  }
};
var sha256 = /* @__PURE__ */ wrapConstructor(() => new SHA256());
var sha224 = /* @__PURE__ */ wrapConstructor(() => new SHA224());
var HMAC = class extends Hash {
  constructor(hash$1, _key) {
    super();
    this.finished = false;
    this.destroyed = false;
    hash(hash$1);
    const key = toBytes(_key);
    this.iHash = hash$1.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad2 = new Uint8Array(blockLen);
    pad2.set(key.length > blockLen ? hash$1.create().update(key).digest() : key);
    for (let i = 0; i < pad2.length; i++)
      pad2[i] ^= 54;
    this.iHash.update(pad2);
    this.oHash = hash$1.create();
    for (let i = 0; i < pad2.length; i++)
      pad2[i] ^= 54 ^ 92;
    this.oHash.update(pad2);
    pad2.fill(0);
  }
  update(buf) {
    exists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    exists(this);
    bytes(out, this.outputLen);
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to || (to = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = (hash2, key, message) => new HMAC(hash2, key).update(message).digest();
hmac.create = (hash2, key) => new HMAC(hash2, key);
var _0n$6 = /* @__PURE__ */ BigInt(0);
var _1n$8 = /* @__PURE__ */ BigInt(1);
var _2n$5 = /* @__PURE__ */ BigInt(2);
function isBytes(a) {
  return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
}
function abytes(item) {
  if (!isBytes(item))
    throw new Error("Uint8Array expected");
}
function abool(title, value) {
  if (typeof value !== "boolean")
    throw new Error(`${title} must be valid boolean, got "${value}".`);
}
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes2) {
  abytes(bytes2);
  let hex = "";
  for (let i = 0; i < bytes2.length; i++) {
    hex += hexes[bytes2[i]];
  }
  return hex;
}
function numberToHexUnpadded(num) {
  const hex = num.toString(16);
  return hex.length & 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return BigInt(hex === "" ? "0" : `0x${hex}`);
}
var asciis = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 };
function asciiToBase16(char) {
  if (char >= asciis._0 && char <= asciis._9)
    return char - asciis._0;
  if (char >= asciis._A && char <= asciis._F)
    return char - (asciis._A - 10);
  if (char >= asciis._a && char <= asciis._f)
    return char - (asciis._a - 10);
  return;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("padded hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function bytesToNumberBE(bytes2) {
  return hexToNumber(bytesToHex(bytes2));
}
function bytesToNumberLE(bytes2) {
  abytes(bytes2);
  return hexToNumber(bytesToHex(Uint8Array.from(bytes2).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function numberToVarBytesBE(n) {
  return hexToBytes(numberToHexUnpadded(n));
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes(hex);
    } catch (e) {
      throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
    }
  } else if (isBytes(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(`${title} must be hex string or Uint8Array`);
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
  return res;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad2 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad2);
    pad2 += a.length;
  }
  return res;
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str));
}
var isPosBig = (n) => typeof n === "bigint" && _0n$6 <= n;
function inRange(n, min, max2) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max2) && min <= n && n < max2;
}
function aInRange(title, n, min, max2) {
  if (!inRange(n, min, max2))
    throw new Error(`expected valid ${title}: ${min} <= n < ${max2}, got ${typeof n} ${n}`);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n$6; n >>= _1n$8, len += 1)
    ;
  return len;
}
function bitGet(n, pos2) {
  return n >> BigInt(pos2) & _1n$8;
}
function bitSet(n, pos2, value) {
  return n | (value ? _1n$8 : _0n$6) << BigInt(pos2);
}
var bitMask = (n) => (_2n$5 << BigInt(n - 1)) - _1n$8;
var u8n = (data) => new Uint8Array(data);
var u8fr = (arr) => Uint8Array.from(arr);
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...b) => hmacFn(k, v, ...b);
  const reseed = (seed = u8n()) => {
    k = h(u8fr([0]), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8fr([1]), seed);
    v = h();
  };
  const gen2 = () => {
    if (i++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen2())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
var validatorFns = {
  bigint: (val) => typeof val === "bigint",
  function: (val) => typeof val === "function",
  boolean: (val) => typeof val === "boolean",
  string: (val) => typeof val === "string",
  stringOrUint8Array: (val) => typeof val === "string" || isBytes(val),
  isSafeInteger: (val) => Number.isSafeInteger(val),
  array: (val) => Array.isArray(val),
  field: (val, object) => object.Fp.isValid(val),
  hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
};
function validateObject(object, validators, optValidators = {}) {
  const checkField = (fieldName, type, isOptional) => {
    const checkVal = validatorFns[type];
    if (typeof checkVal !== "function")
      throw new Error(`Invalid validator "${type}", expected function`);
    const val = object[fieldName];
    if (isOptional && val === void 0)
      return;
    if (!checkVal(val, object)) {
      throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
    }
  };
  for (const [fieldName, type] of Object.entries(validators))
    checkField(fieldName, type, false);
  for (const [fieldName, type] of Object.entries(optValidators))
    checkField(fieldName, type, true);
  return object;
}
var notImplemented = () => {
  throw new Error("not implemented");
};
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
var ut = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  aInRange,
  abool,
  abytes,
  bitGet,
  bitLen,
  bitMask,
  bitSet,
  bytesToHex,
  bytesToNumberBE,
  bytesToNumberLE,
  concatBytes,
  createHmacDrbg,
  ensureBytes,
  equalBytes,
  hexToBytes,
  hexToNumber,
  inRange,
  isBytes,
  memoized,
  notImplemented,
  numberToBytesBE,
  numberToBytesLE,
  numberToHexUnpadded,
  numberToVarBytesBE,
  utf8ToBytes,
  validateObject
});
var _0n$5 = BigInt(0);
var _1n$7 = BigInt(1);
var _2n$4 = BigInt(2);
var _3n$2 = BigInt(3);
var _4n = BigInt(4);
var _5n = BigInt(5);
var _8n$1 = BigInt(8);
BigInt(9);
BigInt(16);
function mod(a, b) {
  const result = a % b;
  return result >= _0n$5 ? result : b + result;
}
function pow(num, power, modulo) {
  if (modulo <= _0n$5 || power < _0n$5)
    throw new Error("Expected power/modulo > 0");
  if (modulo === _1n$7)
    return _0n$5;
  let res = _1n$7;
  while (power > _0n$5) {
    if (power & _1n$7)
      res = res * num % modulo;
    num = num * num % modulo;
    power >>= _1n$7;
  }
  return res;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n$5) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number2, modulo) {
  if (number2 === _0n$5 || modulo <= _0n$5) {
    throw new Error(`invert: expected positive integers, got n=${number2} mod=${modulo}`);
  }
  let a = mod(number2, modulo);
  let b = modulo;
  let x = _0n$5, u = _1n$7;
  while (a !== _0n$5) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    b = a, a = r, x = u, u = m;
  }
  const gcd2 = b;
  if (gcd2 !== _1n$7)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function tonelliShanks(P2) {
  const legendreC = (P2 - _1n$7) / _2n$4;
  let Q, S2, Z2;
  for (Q = P2 - _1n$7, S2 = 0; Q % _2n$4 === _0n$5; Q /= _2n$4, S2++)
    ;
  for (Z2 = _2n$4; Z2 < P2 && pow(Z2, legendreC, P2) !== P2 - _1n$7; Z2++)
    ;
  if (S2 === 1) {
    const p1div4 = (P2 + _1n$7) / _4n;
    return function tonelliFast(Fp2, n) {
      const root = Fp2.pow(n, p1div4);
      if (!Fp2.eql(Fp2.sqr(root), n))
        throw new Error("Cannot find square root");
      return root;
    };
  }
  const Q1div2 = (Q + _1n$7) / _2n$4;
  return function tonelliSlow(Fp2, n) {
    if (Fp2.pow(n, legendreC) === Fp2.neg(Fp2.ONE))
      throw new Error("Cannot find square root");
    let r = S2;
    let g = Fp2.pow(Fp2.mul(Fp2.ONE, Z2), Q);
    let x = Fp2.pow(n, Q1div2);
    let b = Fp2.pow(n, Q);
    while (!Fp2.eql(b, Fp2.ONE)) {
      if (Fp2.eql(b, Fp2.ZERO))
        return Fp2.ZERO;
      let m = 1;
      for (let t2 = Fp2.sqr(b); m < r; m++) {
        if (Fp2.eql(t2, Fp2.ONE))
          break;
        t2 = Fp2.sqr(t2);
      }
      const ge = Fp2.pow(g, _1n$7 << BigInt(r - m - 1));
      g = Fp2.sqr(ge);
      x = Fp2.mul(x, ge);
      b = Fp2.mul(b, g);
      r = m;
    }
    return x;
  };
}
function FpSqrt(P2) {
  if (P2 % _4n === _3n$2) {
    const p1div4 = (P2 + _1n$7) / _4n;
    return function sqrt3mod4(Fp2, n) {
      const root = Fp2.pow(n, p1div4);
      if (!Fp2.eql(Fp2.sqr(root), n))
        throw new Error("Cannot find square root");
      return root;
    };
  }
  if (P2 % _8n$1 === _5n) {
    const c1 = (P2 - _5n) / _8n$1;
    return function sqrt5mod8(Fp2, n) {
      const n2 = Fp2.mul(n, _2n$4);
      const v = Fp2.pow(n2, c1);
      const nv = Fp2.mul(n, v);
      const i = Fp2.mul(Fp2.mul(nv, _2n$4), v);
      const root = Fp2.mul(nv, Fp2.sub(i, Fp2.ONE));
      if (!Fp2.eql(Fp2.sqr(root), n))
        throw new Error("Cannot find square root");
      return root;
    };
  }
  return tonelliShanks(P2);
}
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "isSafeInteger",
    BITS: "isSafeInteger"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  return validateObject(field, opts);
}
function FpPow(f2, num, power) {
  if (power < _0n$5)
    throw new Error("Expected power > 0");
  if (power === _0n$5)
    return f2.ONE;
  if (power === _1n$7)
    return num;
  let p = f2.ONE;
  let d = num;
  while (power > _0n$5) {
    if (power & _1n$7)
      p = f2.mul(p, d);
    d = f2.sqr(d);
    power >>= _1n$7;
  }
  return p;
}
function FpInvertBatch(f2, nums) {
  const tmp = new Array(nums.length);
  const lastMultiplied = nums.reduce((acc, num, i) => {
    if (f2.is0(num))
      return acc;
    tmp[i] = acc;
    return f2.mul(acc, num);
  }, f2.ONE);
  const inverted = f2.inv(lastMultiplied);
  nums.reduceRight((acc, num, i) => {
    if (f2.is0(num))
      return acc;
    tmp[i] = f2.mul(acc, tmp[i]);
    return f2.mul(acc, num);
  }, inverted);
  return tmp;
}
function nLength(n, nBitLength) {
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLen2, isLE2 = false, redef = {}) {
  if (ORDER <= _0n$5)
    throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
  if (BYTES > 2048)
    throw new Error("Field lengths over 2048 bytes are not supported");
  const sqrtP = FpSqrt(ORDER);
  const f2 = Object.freeze({
    ORDER,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n$5,
    ONE: _1n$7,
    create: (num) => mod(num, ORDER),
    isValid: (num) => {
      if (typeof num !== "bigint")
        throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
      return _0n$5 <= num && num < ORDER;
    },
    is0: (num) => num === _0n$5,
    isOdd: (num) => (num & _1n$7) === _1n$7,
    neg: (num) => mod(-num, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num) => mod(num * num, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num, power) => FpPow(f2, num, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    // Same as above, but doesn't normalize
    sqrN: (num) => num * num,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num) => invert(num, ORDER),
    sqrt: redef.sqrt || ((n) => sqrtP(f2, n)),
    invertBatch: (lst) => FpInvertBatch(f2, lst),
    // TODO: do we really need constant cmov?
    // We don't have const-time bigints anyway, so probably will be not very useful
    cmov: (a, b, c) => c ? b : a,
    toBytes: (num) => isLE2 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
    fromBytes: (bytes2) => {
      if (bytes2.length !== BYTES)
        throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes2.length}`);
      return isLE2 ? bytesToNumberLE(bytes2) : bytesToNumberBE(bytes2);
    }
  });
  return Object.freeze(f2);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength2 = fieldOrder.toString(2).length;
  return Math.ceil(bitLength2 / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE2 = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error(`expected ${minLen}-1024 bytes of input, got ${len}`);
  const num = isLE2 ? bytesToNumberBE(key) : bytesToNumberLE(key);
  const reduced = mod(num, fieldOrder - _1n$7) + _1n$7;
  return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
var _0n$4 = BigInt(0);
var _1n$6 = BigInt(1);
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function wNAF(c, bits2) {
  const constTimeNegate = (condition, item) => {
    const neg = item.negate();
    return condition ? neg : item;
  };
  const validateW = (W) => {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits2)
      throw new Error(`Wrong window size=${W}, should be [1..${bits2}]`);
  };
  const opts = (W) => {
    validateW(W);
    const windows = Math.ceil(bits2 / W) + 1;
    const windowSize = 2 ** (W - 1);
    return { windows, windowSize };
  };
  return {
    constTimeNegate,
    // non-const time multiplication ladder
    unsafeLadder(elm, n) {
      let p = c.ZERO;
      let d = elm;
      while (n > _0n$4) {
        if (n & _1n$6)
          p = p.add(d);
        d = d.double();
        n >>= _1n$6;
      }
      return p;
    },
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(elm, W) {
      const { windows, windowSize } = opts(W);
      const points = [];
      let p = elm;
      let base = p;
      for (let window2 = 0; window2 < windows; window2++) {
        base = p;
        points.push(base);
        for (let i = 1; i < windowSize; i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    },
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
      const { windows, windowSize } = opts(W);
      let p = c.ZERO;
      let f2 = c.BASE;
      const mask = BigInt(2 ** W - 1);
      const maxNumber = 2 ** W;
      const shiftBy = BigInt(W);
      for (let window2 = 0; window2 < windows; window2++) {
        const offset = window2 * windowSize;
        let wbits2 = Number(n & mask);
        n >>= shiftBy;
        if (wbits2 > windowSize) {
          wbits2 -= maxNumber;
          n += _1n$6;
        }
        const offset1 = offset;
        const offset2 = offset + Math.abs(wbits2) - 1;
        const cond1 = window2 % 2 !== 0;
        const cond2 = wbits2 < 0;
        if (wbits2 === 0) {
          f2 = f2.add(constTimeNegate(cond1, precomputes[offset1]));
        } else {
          p = p.add(constTimeNegate(cond2, precomputes[offset2]));
        }
      }
      return { p, f: f2 };
    },
    wNAFCached(P2, n, transform2) {
      const W = pointWindowSizes.get(P2) || 1;
      let comp = pointPrecomputes.get(P2);
      if (!comp) {
        comp = this.precomputeWindow(P2, W);
        if (W !== 1)
          pointPrecomputes.set(P2, transform2(comp));
      }
      return this.wNAF(W, comp, n);
    },
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    setWindowSize(P2, W) {
      validateW(W);
      pointWindowSizes.set(P2, W);
      pointPrecomputes.delete(P2);
    }
  };
}
function pippenger(c, field, points, scalars) {
  if (!Array.isArray(points) || !Array.isArray(scalars) || scalars.length !== points.length)
    throw new Error("arrays of points and scalars must have equal length");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error(`wrong scalar at index ${i}`);
  });
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error(`wrong point at index ${i}`);
  });
  const wbits2 = bitLen(BigInt(points.length));
  const windowSize = wbits2 > 12 ? wbits2 - 3 : wbits2 > 4 ? wbits2 - 2 : wbits2 ? 2 : 1;
  const MASK = (1 << windowSize) - 1;
  const buckets = new Array(MASK + 1).fill(c.ZERO);
  const lastBits = Math.floor((field.BITS - 1) / windowSize) * windowSize;
  let sum = c.ZERO;
  for (let i = lastBits; i >= 0; i -= windowSize) {
    buckets.fill(c.ZERO);
    for (let j = 0; j < scalars.length; j++) {
      const scalar = scalars[j];
      const wbits3 = Number(scalar >> BigInt(i) & BigInt(MASK));
      buckets[wbits3] = buckets[wbits3].add(points[j]);
    }
    let resI = c.ZERO;
    for (let j = buckets.length - 1, sumI = c.ZERO; j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum = sum.add(resI);
    if (i !== 0)
      for (let j = 0; j < windowSize; j++)
        sum = sum.double();
  }
  return sum;
}
function validateBasic(curve) {
  validateField(curve.Fp);
  validateObject(curve, {
    n: "bigint",
    h: "bigint",
    Gx: "field",
    Gy: "field"
  }, {
    nBitLength: "isSafeInteger",
    nByteLength: "isSafeInteger"
  });
  return Object.freeze({
    ...nLength(curve.n, curve.nBitLength),
    ...curve,
    ...{ p: curve.Fp.ORDER }
  });
}
function validateSigVerOpts(opts) {
  if (opts.lowS !== void 0)
    abool("lowS", opts.lowS);
  if (opts.prehash !== void 0)
    abool("prehash", opts.prehash);
}
function validatePointOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    a: "field",
    b: "field"
  }, {
    allowedPrivateKeyLengths: "array",
    wrapPrivateKey: "boolean",
    isTorsionFree: "function",
    clearCofactor: "function",
    allowInfinityPoint: "boolean",
    fromBytes: "function",
    toBytes: "function"
  });
  const { endo, Fp: Fp2, a } = opts;
  if (endo) {
    if (!Fp2.eql(a, Fp2.ZERO)) {
      throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
    }
    if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
      throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
    }
  }
  return Object.freeze({ ...opts });
}
var { bytesToNumberBE: b2n, hexToBytes: h2b } = ut;
var DER = {
  // asn.1 DER encoding utils
  Err: class DERErr extends Error {
    constructor(m = "") {
      super(m);
    }
  },
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      return `${numberToHexUnpadded(tag)}${lenLen}${len}${data}`;
    },
    // v - value, l - left bytes (unparsed)
    decode(tag, data) {
      const { Err: E } = DER;
      let pos2 = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos2++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos2++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos2, pos2 + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos2 += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos2, pos2 + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos2 + length) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(num) {
      const { Err: E } = DER;
      if (num < _0n$3)
        throw new E("integer: negative integers are not allowed");
      let hex = numberToHexUnpadded(num);
      if (Number.parseInt(hex[0], 16) & 8)
        hex = "00" + hex;
      if (hex.length & 1)
        throw new E("unexpected assertion");
      return hex;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("Invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("Invalid signature integer: unnecessary leading zero");
      return b2n(data);
    }
  },
  toSig(hex) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = typeof hex === "string" ? h2b(hex) : hex;
    abytes(data);
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("Invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("Invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const seq = `${tlv.encode(2, int.encode(sig.r))}${tlv.encode(2, int.encode(sig.s))}`;
    return tlv.encode(48, seq);
  }
};
var _0n$3 = BigInt(0);
var _1n$5 = BigInt(1);
BigInt(2);
var _3n$1 = BigInt(3);
BigInt(4);
function weierstrassPoints(opts) {
  const CURVE2 = validatePointOpts(opts);
  const { Fp: Fp2 } = CURVE2;
  const Fn = Field(CURVE2.n, CURVE2.nBitLength);
  const toBytes2 = CURVE2.toBytes || ((_c, point, _isCompressed) => {
    const a = point.toAffine();
    return concatBytes(Uint8Array.from([4]), Fp2.toBytes(a.x), Fp2.toBytes(a.y));
  });
  const fromBytes = CURVE2.fromBytes || ((bytes2) => {
    const tail = bytes2.subarray(1);
    const x = Fp2.fromBytes(tail.subarray(0, Fp2.BYTES));
    const y = Fp2.fromBytes(tail.subarray(Fp2.BYTES, 2 * Fp2.BYTES));
    return { x, y };
  });
  function weierstrassEquation(x) {
    const { a, b } = CURVE2;
    const x2 = Fp2.sqr(x);
    const x3 = Fp2.mul(x2, x);
    return Fp2.add(Fp2.add(x3, Fp2.mul(x, a)), b);
  }
  if (!Fp2.eql(Fp2.sqr(CURVE2.Gy), weierstrassEquation(CURVE2.Gx)))
    throw new Error("bad generator point: equation left != right");
  function isWithinCurveOrder(num) {
    return inRange(num, _1n$5, CURVE2.n);
  }
  function normPrivateKeyToScalar(key) {
    const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE2;
    if (lengths && typeof key !== "bigint") {
      if (isBytes(key))
        key = bytesToHex(key);
      if (typeof key !== "string" || !lengths.includes(key.length))
        throw new Error("Invalid key");
      key = key.padStart(nByteLength * 2, "0");
    }
    let num;
    try {
      num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
    } catch (error) {
      throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
    }
    if (wrapPrivateKey)
      num = mod(num, N);
    aInRange("private key", num, _1n$5, N);
    return num;
  }
  function assertPrjPoint(other) {
    if (!(other instanceof Point))
      throw new Error("ProjectivePoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { px: x, py: y, pz: z } = p;
    if (Fp2.eql(z, Fp2.ONE))
      return { x, y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp2.ONE : Fp2.inv(z);
    const ax = Fp2.mul(x, iz);
    const ay = Fp2.mul(y, iz);
    const zz = Fp2.mul(z, iz);
    if (is0)
      return { x: Fp2.ZERO, y: Fp2.ZERO };
    if (!Fp2.eql(zz, Fp2.ONE))
      throw new Error("invZ was invalid");
    return { x: ax, y: ay };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (CURVE2.allowInfinityPoint && !Fp2.is0(p.py))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp2.isValid(x) || !Fp2.isValid(y))
      throw new Error("bad point: x or y not FE");
    const left = Fp2.sqr(y);
    const right = weierstrassEquation(x);
    if (!Fp2.eql(left, right))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  class Point {
    constructor(px, py, pz) {
      this.px = px;
      this.py = py;
      this.pz = pz;
      if (px == null || !Fp2.isValid(px))
        throw new Error("x required");
      if (py == null || !Fp2.isValid(py))
        throw new Error("y required");
      if (pz == null || !Fp2.isValid(pz))
        throw new Error("z required");
      Object.freeze(this);
    }
    // Does not validate if the point is on-curve.
    // Use fromHex instead, or call assertValidity() later.
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp2.isValid(x) || !Fp2.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      const is0 = (i) => Fp2.eql(i, Fp2.ZERO);
      if (is0(x) && is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp2.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     * Takes a bunch of Projective Points but executes only one
     * inversion on all of them. Inversion is very slow operation,
     * so this improves performance massively.
     * Optimization: converts a list of projective points to a list of identical points with Z=1.
     */
    static normalizeZ(points) {
      const toInv = Fp2.invertBatch(points.map((p) => p.pz));
      return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
    }
    /**
     * Converts hash string or Uint8Array to Point.
     * @param hex short/long ECDSA hex
     */
    static fromHex(hex) {
      const P2 = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
      P2.assertValidity();
      return P2;
    }
    // Multiplies generator point by privateKey.
    static fromPrivateKey(privateKey) {
      return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
    }
    // Multiscalar Multiplication
    static msm(points, scalars) {
      return pippenger(Point, Fn, points, scalars);
    }
    // "Private method", don't use it directly
    _setWindowSize(windowSize) {
      wnaf.setWindowSize(this, windowSize);
    }
    // A point on curve is valid if it conforms to equation.
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (Fp2.isOdd)
        return !Fp2.isOdd(y);
      throw new Error("Field doesn't support isOdd");
    }
    /**
     * Compare one point to another.
     */
    equals(other) {
      assertPrjPoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      const U1 = Fp2.eql(Fp2.mul(X1, Z2), Fp2.mul(X2, Z1));
      const U2 = Fp2.eql(Fp2.mul(Y1, Z2), Fp2.mul(Y2, Z1));
      return U1 && U2;
    }
    /**
     * Flips point to one corresponding to (x, -y) in Affine coordinates.
     */
    negate() {
      return new Point(this.px, Fp2.neg(this.py), this.pz);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE2;
      const b3 = Fp2.mul(b, _3n$1);
      const { px: X1, py: Y1, pz: Z1 } = this;
      let X3 = Fp2.ZERO, Y3 = Fp2.ZERO, Z3 = Fp2.ZERO;
      let t0 = Fp2.mul(X1, X1);
      let t1 = Fp2.mul(Y1, Y1);
      let t2 = Fp2.mul(Z1, Z1);
      let t3 = Fp2.mul(X1, Y1);
      t3 = Fp2.add(t3, t3);
      Z3 = Fp2.mul(X1, Z1);
      Z3 = Fp2.add(Z3, Z3);
      X3 = Fp2.mul(a, Z3);
      Y3 = Fp2.mul(b3, t2);
      Y3 = Fp2.add(X3, Y3);
      X3 = Fp2.sub(t1, Y3);
      Y3 = Fp2.add(t1, Y3);
      Y3 = Fp2.mul(X3, Y3);
      X3 = Fp2.mul(t3, X3);
      Z3 = Fp2.mul(b3, Z3);
      t2 = Fp2.mul(a, t2);
      t3 = Fp2.sub(t0, t2);
      t3 = Fp2.mul(a, t3);
      t3 = Fp2.add(t3, Z3);
      Z3 = Fp2.add(t0, t0);
      t0 = Fp2.add(Z3, t0);
      t0 = Fp2.add(t0, t2);
      t0 = Fp2.mul(t0, t3);
      Y3 = Fp2.add(Y3, t0);
      t2 = Fp2.mul(Y1, Z1);
      t2 = Fp2.add(t2, t2);
      t0 = Fp2.mul(t2, t3);
      X3 = Fp2.sub(X3, t0);
      Z3 = Fp2.mul(t2, t1);
      Z3 = Fp2.add(Z3, Z3);
      Z3 = Fp2.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      assertPrjPoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      let X3 = Fp2.ZERO, Y3 = Fp2.ZERO, Z3 = Fp2.ZERO;
      const a = CURVE2.a;
      const b3 = Fp2.mul(CURVE2.b, _3n$1);
      let t0 = Fp2.mul(X1, X2);
      let t1 = Fp2.mul(Y1, Y2);
      let t2 = Fp2.mul(Z1, Z2);
      let t3 = Fp2.add(X1, Y1);
      let t4 = Fp2.add(X2, Y2);
      t3 = Fp2.mul(t3, t4);
      t4 = Fp2.add(t0, t1);
      t3 = Fp2.sub(t3, t4);
      t4 = Fp2.add(X1, Z1);
      let t5 = Fp2.add(X2, Z2);
      t4 = Fp2.mul(t4, t5);
      t5 = Fp2.add(t0, t2);
      t4 = Fp2.sub(t4, t5);
      t5 = Fp2.add(Y1, Z1);
      X3 = Fp2.add(Y2, Z2);
      t5 = Fp2.mul(t5, X3);
      X3 = Fp2.add(t1, t2);
      t5 = Fp2.sub(t5, X3);
      Z3 = Fp2.mul(a, t4);
      X3 = Fp2.mul(b3, t2);
      Z3 = Fp2.add(X3, Z3);
      X3 = Fp2.sub(t1, Z3);
      Z3 = Fp2.add(t1, Z3);
      Y3 = Fp2.mul(X3, Z3);
      t1 = Fp2.add(t0, t0);
      t1 = Fp2.add(t1, t0);
      t2 = Fp2.mul(a, t2);
      t4 = Fp2.mul(b3, t4);
      t1 = Fp2.add(t1, t2);
      t2 = Fp2.sub(t0, t2);
      t2 = Fp2.mul(a, t2);
      t4 = Fp2.add(t4, t2);
      t0 = Fp2.mul(t1, t4);
      Y3 = Fp2.add(Y3, t0);
      t0 = Fp2.mul(t5, t4);
      X3 = Fp2.mul(t3, X3);
      X3 = Fp2.sub(X3, t0);
      t0 = Fp2.mul(t3, t1);
      Z3 = Fp2.mul(t5, Z3);
      Z3 = Fp2.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    wNAF(n) {
      return wnaf.wNAFCached(this, n, Point.normalizeZ);
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed private key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      aInRange("scalar", sc, _0n$3, CURVE2.n);
      const I2 = Point.ZERO;
      if (sc === _0n$3)
        return I2;
      if (sc === _1n$5)
        return this;
      const { endo } = CURVE2;
      if (!endo)
        return wnaf.unsafeLadder(this, sc);
      let { k1neg, k1, k2neg, k2 } = endo.splitScalar(sc);
      let k1p = I2;
      let k2p = I2;
      let d = this;
      while (k1 > _0n$3 || k2 > _0n$3) {
        if (k1 & _1n$5)
          k1p = k1p.add(d);
        if (k2 & _1n$5)
          k2p = k2p.add(d);
        d = d.double();
        k1 >>= _1n$5;
        k2 >>= _1n$5;
      }
      if (k1neg)
        k1p = k1p.negate();
      if (k2neg)
        k2p = k2p.negate();
      k2p = new Point(Fp2.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
      return k1p.add(k2p);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo, n: N } = CURVE2;
      aInRange("scalar", scalar, _1n$5, N);
      let point, fake;
      if (endo) {
        const { k1neg, k1, k2neg, k2 } = endo.splitScalar(scalar);
        let { p: k1p, f: f1p } = this.wNAF(k1);
        let { p: k2p, f: f2p } = this.wNAF(k2);
        k1p = wnaf.constTimeNegate(k1neg, k1p);
        k2p = wnaf.constTimeNegate(k2neg, k2p);
        k2p = new Point(Fp2.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
        point = k1p.add(k2p);
        fake = f1p.add(f2p);
      } else {
        const { p, f: f2 } = this.wNAF(scalar);
        point = p;
        fake = f2;
      }
      return Point.normalizeZ([point, fake])[0];
    }
    /**
     * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
     * Not using Strauss-Shamir trick: precomputation tables are faster.
     * The trick could be useful if both P and Q are not G (not in our case).
     * @returns non-zero affine point
     */
    multiplyAndAddUnsafe(Q, a, b) {
      const G3 = Point.BASE;
      const mul3 = (P2, a2) => a2 === _0n$3 || a2 === _1n$5 || !P2.equals(G3) ? P2.multiplyUnsafe(a2) : P2.multiply(a2);
      const sum = mul3(this, a).add(mul3(Q, b));
      return sum.is0() ? void 0 : sum;
    }
    // Converts Projective point to affine (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    // (x, y, z) ∋ (x=x/z, y=y/z)
    toAffine(iz) {
      return toAffineMemo(this, iz);
    }
    isTorsionFree() {
      const { h: cofactor, isTorsionFree } = CURVE2;
      if (cofactor === _1n$5)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: cofactor, clearCofactor } = CURVE2;
      if (cofactor === _1n$5)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(CURVE2.h);
    }
    toRawBytes(isCompressed = true) {
      abool("isCompressed", isCompressed);
      this.assertValidity();
      return toBytes2(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      abool("isCompressed", isCompressed);
      return bytesToHex(this.toRawBytes(isCompressed));
    }
  }
  Point.BASE = new Point(CURVE2.Gx, CURVE2.Gy, Fp2.ONE);
  Point.ZERO = new Point(Fp2.ZERO, Fp2.ONE, Fp2.ZERO);
  const _bits = CURVE2.nBitLength;
  const wnaf = wNAF(Point, CURVE2.endo ? Math.ceil(_bits / 2) : _bits);
  return {
    CURVE: CURVE2,
    ProjectivePoint: Point,
    normPrivateKeyToScalar,
    weierstrassEquation,
    isWithinCurveOrder
  };
}
function validateOpts$2(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    hash: "hash",
    hmac: "function",
    randomBytes: "function"
  }, {
    bits2int: "function",
    bits2int_modN: "function",
    lowS: "boolean"
  });
  return Object.freeze({ lowS: true, ...opts });
}
function weierstrass(curveDef) {
  const CURVE2 = validateOpts$2(curveDef);
  const { Fp: Fp2, n: CURVE_ORDER } = CURVE2;
  const compressedLen = Fp2.BYTES + 1;
  const uncompressedLen = 2 * Fp2.BYTES + 1;
  function modN(a) {
    return mod(a, CURVE_ORDER);
  }
  function invN(a) {
    return invert(a, CURVE_ORDER);
  }
  const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
    ...CURVE2,
    toBytes(_c, point, isCompressed) {
      const a = point.toAffine();
      const x = Fp2.toBytes(a.x);
      const cat = concatBytes;
      abool("isCompressed", isCompressed);
      if (isCompressed) {
        return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
      } else {
        return cat(Uint8Array.from([4]), x, Fp2.toBytes(a.y));
      }
    },
    fromBytes(bytes2) {
      const len = bytes2.length;
      const head = bytes2[0];
      const tail = bytes2.subarray(1);
      if (len === compressedLen && (head === 2 || head === 3)) {
        const x = bytesToNumberBE(tail);
        if (!inRange(x, _1n$5, Fp2.ORDER))
          throw new Error("Point is not on curve");
        const y2 = weierstrassEquation(x);
        let y;
        try {
          y = Fp2.sqrt(y2);
        } catch (sqrtError) {
          const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
          throw new Error("Point is not on curve" + suffix);
        }
        const isYOdd = (y & _1n$5) === _1n$5;
        const isHeadOdd = (head & 1) === 1;
        if (isHeadOdd !== isYOdd)
          y = Fp2.neg(y);
        return { x, y };
      } else if (len === uncompressedLen && head === 4) {
        const x = Fp2.fromBytes(tail.subarray(0, Fp2.BYTES));
        const y = Fp2.fromBytes(tail.subarray(Fp2.BYTES, 2 * Fp2.BYTES));
        return { x, y };
      } else {
        throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
      }
    }
  });
  const numToNByteStr = (num) => bytesToHex(numberToBytesBE(num, CURVE2.nByteLength));
  function isBiggerThanHalfOrder(number2) {
    const HALF = CURVE_ORDER >> _1n$5;
    return number2 > HALF;
  }
  function normalizeS(s) {
    return isBiggerThanHalfOrder(s) ? modN(-s) : s;
  }
  const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
  class Signature2 {
    constructor(r, s, recovery) {
      this.r = r;
      this.s = s;
      this.recovery = recovery;
      this.assertValidity();
    }
    // pair (bytes of r, bytes of s)
    static fromCompact(hex) {
      const l = CURVE2.nByteLength;
      hex = ensureBytes("compactSignature", hex, l * 2);
      return new Signature2(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
    }
    // DER encoded ECDSA signature
    // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
    static fromDER(hex) {
      const { r, s } = DER.toSig(ensureBytes("DER", hex));
      return new Signature2(r, s);
    }
    assertValidity() {
      aInRange("r", this.r, _1n$5, CURVE_ORDER);
      aInRange("s", this.s, _1n$5, CURVE_ORDER);
    }
    addRecoveryBit(recovery) {
      return new Signature2(this.r, this.s, recovery);
    }
    recoverPublicKey(msgHash) {
      const { r, s, recovery: rec } = this;
      const h = bits2int_modN(ensureBytes("msgHash", msgHash));
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const radj = rec === 2 || rec === 3 ? r + CURVE2.n : r;
      if (radj >= Fp2.ORDER)
        throw new Error("recovery id 2 or 3 invalid");
      const prefix = (rec & 1) === 0 ? "02" : "03";
      const R = Point.fromHex(prefix + numToNByteStr(radj));
      const ir = invN(radj);
      const u1 = modN(-h * ir);
      const u2 = modN(s * ir);
      const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
      if (!Q)
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new Signature2(this.r, modN(-this.s), this.recovery) : this;
    }
    // DER-encoded
    toDERRawBytes() {
      return hexToBytes(this.toDERHex());
    }
    toDERHex() {
      return DER.hexFromSig({ r: this.r, s: this.s });
    }
    // padded bytes of r, then padded bytes of s
    toCompactRawBytes() {
      return hexToBytes(this.toCompactHex());
    }
    toCompactHex() {
      return numToNByteStr(this.r) + numToNByteStr(this.s);
    }
  }
  const utils = {
    isValidPrivateKey(privateKey) {
      try {
        normPrivateKeyToScalar(privateKey);
        return true;
      } catch (error) {
        return false;
      }
    },
    normPrivateKeyToScalar,
    /**
     * Produces cryptographically secure private key from random of size
     * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
     */
    randomPrivateKey: () => {
      const length = getMinHashLength(CURVE2.n);
      return mapHashToField(CURVE2.randomBytes(length), CURVE2.n);
    },
    /**
     * Creates precompute table for an arbitrary EC point. Makes point "cached".
     * Allows to massively speed-up `point.multiply(scalar)`.
     * @returns cached point
     * @example
     * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
     * fast.multiply(privKey); // much faster ECDH now
     */
    precompute(windowSize = 8, point = Point.BASE) {
      point._setWindowSize(windowSize);
      point.multiply(BigInt(3));
      return point;
    }
  };
  function getPublicKey(privateKey, isCompressed = true) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function isProbPub(item) {
    const arr = isBytes(item);
    const str = typeof item === "string";
    const len = (arr || str) && item.length;
    if (arr)
      return len === compressedLen || len === uncompressedLen;
    if (str)
      return len === 2 * compressedLen || len === 2 * uncompressedLen;
    if (item instanceof Point)
      return true;
    return false;
  }
  function getSharedSecret(privateA, publicB, isCompressed = true) {
    if (isProbPub(privateA))
      throw new Error("first arg must be private key");
    if (!isProbPub(publicB))
      throw new Error("second arg must be public key");
    const b = Point.fromHex(publicB);
    return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
  }
  const bits2int = CURVE2.bits2int || function(bytes2) {
    const num = bytesToNumberBE(bytes2);
    const delta = bytes2.length * 8 - CURVE2.nBitLength;
    return delta > 0 ? num >> BigInt(delta) : num;
  };
  const bits2int_modN = CURVE2.bits2int_modN || function(bytes2) {
    return modN(bits2int(bytes2));
  };
  const ORDER_MASK = bitMask(CURVE2.nBitLength);
  function int2octets(num) {
    aInRange(`num < 2^${CURVE2.nBitLength}`, num, _0n$3, ORDER_MASK);
    return numberToBytesBE(num, CURVE2.nByteLength);
  }
  function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
    if (["recovered", "canonical"].some((k) => k in opts))
      throw new Error("sign() legacy options not supported");
    const { hash: hash2, randomBytes: randomBytes3 } = CURVE2;
    let { lowS, prehash, extraEntropy: ent } = opts;
    if (lowS == null)
      lowS = true;
    msgHash = ensureBytes("msgHash", msgHash);
    validateSigVerOpts(opts);
    if (prehash)
      msgHash = ensureBytes("prehashed msgHash", hash2(msgHash));
    const h1int = bits2int_modN(msgHash);
    const d = normPrivateKeyToScalar(privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (ent != null && ent !== false) {
      const e = ent === true ? randomBytes3(Fp2.BYTES) : ent;
      seedArgs.push(ensureBytes("extraEntropy", e));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!isWithinCurveOrder(k))
        return;
      const ik = invN(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = modN(q.x);
      if (r === _0n$3)
        return;
      const s = modN(ik * modN(m + r * d));
      if (s === _0n$3)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n$5);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = normalizeS(s);
        recovery ^= 1;
      }
      return new Signature2(r, normS, recovery);
    }
    return { seed, k2sig };
  }
  const defaultSigOpts = { lowS: CURVE2.lowS, prehash: false };
  const defaultVerOpts = { lowS: CURVE2.lowS, prehash: false };
  function sign(msgHash, privKey, opts = defaultSigOpts) {
    const { seed, k2sig } = prepSig(msgHash, privKey, opts);
    const C = CURVE2;
    const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
    return drbg(seed, k2sig);
  }
  Point.BASE._setWindowSize(8);
  function verify2(signature, msgHash, publicKey, opts = defaultVerOpts) {
    const sg = signature;
    msgHash = ensureBytes("msgHash", msgHash);
    publicKey = ensureBytes("publicKey", publicKey);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    validateSigVerOpts(opts);
    const { lowS, prehash } = opts;
    let _sig = void 0;
    let P2;
    try {
      if (typeof sg === "string" || isBytes(sg)) {
        try {
          _sig = Signature2.fromDER(sg);
        } catch (derError) {
          if (!(derError instanceof DER.Err))
            throw derError;
          _sig = Signature2.fromCompact(sg);
        }
      } else if (typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint") {
        const { r: r2, s: s2 } = sg;
        _sig = new Signature2(r2, s2);
      } else {
        throw new Error("PARSE");
      }
      P2 = Point.fromHex(publicKey);
    } catch (error) {
      if (error.message === "PARSE")
        throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
      return false;
    }
    if (lowS && _sig.hasHighS())
      return false;
    if (prehash)
      msgHash = CURVE2.hash(msgHash);
    const { r, s } = _sig;
    const h = bits2int_modN(msgHash);
    const is = invN(s);
    const u1 = modN(h * is);
    const u2 = modN(r * is);
    const R = Point.BASE.multiplyAndAddUnsafe(P2, u1, u2)?.toAffine();
    if (!R)
      return false;
    const v = modN(R.x);
    return v === r;
  }
  return {
    CURVE: CURVE2,
    getPublicKey,
    getSharedSecret,
    sign,
    verify: verify2,
    ProjectivePoint: Point,
    Signature: Signature2,
    utils
  };
}
function getHash(hash2) {
  return {
    hash: hash2,
    hmac: (key, ...msgs) => hmac(hash2, key, concatBytes$1(...msgs)),
    randomBytes: randomBytes2
  };
}
function createCurve(curveDef, defHash) {
  const create2 = (hash2) => weierstrass({ ...curveDef, ...getHash(hash2) });
  return Object.freeze({ ...create2(defHash), create: create2 });
}
var Fp$7 = Field(BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"));
var CURVE_A$4 = Fp$7.create(BigInt("-3"));
var CURVE_B$4 = BigInt("0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b");
var p256 = createCurve({
  a: CURVE_A$4,
  // Equation params: a, b
  b: CURVE_B$4,
  Fp: Fp$7,
  // Field: 2n**224n * (2n**32n-1n) + 2n**192n + 2n**96n-1n
  // Curve order, total count of valid points in the field
  n: BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"),
  // Base (generator) point (x, y)
  Gx: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"),
  Gy: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"),
  h: BigInt(1),
  lowS: false
}, sha256);
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  let Ah = new Uint32Array(lst.length);
  let Al = new Uint32Array(lst.length);
  for (let i = 0; i < lst.length; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
var rotr32H = (_h, l) => l;
var rotr32L = (h, _l) => h;
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
var u64 = {
  fromBig,
  split,
  toBig,
  shrSH,
  shrSL,
  rotrSH,
  rotrSL,
  rotrBH,
  rotrBL,
  rotr32H,
  rotr32L,
  rotlSH,
  rotlSL,
  rotlBH,
  rotlBL,
  add,
  add3L,
  add3H,
  add4L,
  add4H,
  add5H,
  add5L
};
var [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64.split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
var SHA512 = class extends HashMD {
  constructor() {
    super(128, 64, 16, false);
    this.Ah = 1779033703 | 0;
    this.Al = 4089235720 | 0;
    this.Bh = 3144134277 | 0;
    this.Bl = 2227873595 | 0;
    this.Ch = 1013904242 | 0;
    this.Cl = 4271175723 | 0;
    this.Dh = 2773480762 | 0;
    this.Dl = 1595750129 | 0;
    this.Eh = 1359893119 | 0;
    this.El = 2917565137 | 0;
    this.Fh = 2600822924 | 0;
    this.Fl = 725511199 | 0;
    this.Gh = 528734635 | 0;
    this.Gl = 4215389547 | 0;
    this.Hh = 1541459225 | 0;
    this.Hl = 327033209 | 0;
  }
  // prettier-ignore
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  // prettier-ignore
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16; i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
      const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
      const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
      const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0; i < 80; i++) {
      const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
      const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
      const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = u64.add3L(T1l, sigma0l, MAJl);
      Ah = u64.add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    SHA512_W_H.fill(0);
    SHA512_W_L.fill(0);
  }
  destroy() {
    this.buffer.fill(0);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var SHA384 = class extends SHA512 {
  constructor() {
    super();
    this.Ah = 3418070365 | 0;
    this.Al = 3238371032 | 0;
    this.Bh = 1654270250 | 0;
    this.Bl = 914150663 | 0;
    this.Ch = 2438529370 | 0;
    this.Cl = 812702999 | 0;
    this.Dh = 355462360 | 0;
    this.Dl = 4144912697 | 0;
    this.Eh = 1731405415 | 0;
    this.El = 4290775857 | 0;
    this.Fh = 2394180231 | 0;
    this.Fl = 1750603025 | 0;
    this.Gh = 3675008525 | 0;
    this.Gl = 1694076839 | 0;
    this.Hh = 1203062813 | 0;
    this.Hl = 3204075428 | 0;
    this.outputLen = 48;
  }
};
var sha512 = /* @__PURE__ */ wrapConstructor(() => new SHA512());
var sha384 = /* @__PURE__ */ wrapConstructor(() => new SHA384());
var P$1 = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff");
var Fp$6 = Field(P$1);
var CURVE_A$3 = Fp$6.create(BigInt("-3"));
var CURVE_B$3 = BigInt("0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef");
var p384 = createCurve({
  a: CURVE_A$3,
  // Equation params: a, b
  b: CURVE_B$3,
  Fp: Fp$6,
  // Field: 2n**384n - 2n**128n - 2n**96n + 2n**32n - 1n
  // Curve order, total count of valid points in the field.
  n: BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973"),
  // Base (generator) point (x, y)
  Gx: BigInt("0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"),
  Gy: BigInt("0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"),
  h: BigInt(1),
  lowS: false
}, sha384);
var P = BigInt("0x1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
var Fp$5 = Field(P);
var CURVE = {
  a: Fp$5.create(BigInt("-3")),
  b: BigInt("0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00"),
  Fp: Fp$5,
  n: BigInt("0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409"),
  Gx: BigInt("0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66"),
  Gy: BigInt("0x011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650"),
  h: BigInt(1)
};
var p521 = createCurve({
  a: CURVE.a,
  // Equation params: a, b
  b: CURVE.b,
  Fp: Fp$5,
  // Field: 2n**521n - 1n
  // Curve order, total count of valid points in the field
  n: CURVE.n,
  Gx: CURVE.Gx,
  // Base point (x, y) aka generator point
  Gy: CURVE.Gy,
  h: CURVE.h,
  lowS: false,
  allowedPrivateKeyLengths: [130, 131, 132]
  // P521 keys are variable-length. Normalize to 132b
}, sha512);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
var _0n$2 = /* @__PURE__ */ BigInt(0);
var _1n$4 = /* @__PURE__ */ BigInt(1);
var _2n$3 = /* @__PURE__ */ BigInt(2);
var _7n = /* @__PURE__ */ BigInt(7);
var _256n = /* @__PURE__ */ BigInt(256);
var _0x71n = /* @__PURE__ */ BigInt(113);
for (let round = 0, R = _1n$4, x = 1, y = 0; round < 24; round++) {
  [x, y] = [y, (2 * x + 3 * y) % 5];
  SHA3_PI.push(2 * (5 * y + x));
  SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
  let t = _0n$2;
  for (let j = 0; j < 7; j++) {
    R = (R << _1n$4 ^ (R >> _7n) * _0x71n) % _256n;
    if (R & _2n$3)
      t ^= _1n$4 << (_1n$4 << /* @__PURE__ */ BigInt(j)) - _1n$4;
  }
  _SHA3_IOTA.push(t);
}
var [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split(_SHA3_IOTA, true);
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  B.fill(0);
}
var Keccak = class _Keccak extends Hash {
  // NOTE: we accept arguments in bytes instead of bits here.
  constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
    super();
    this.blockLen = blockLen;
    this.suffix = suffix;
    this.outputLen = outputLen;
    this.enableXOF = enableXOF;
    this.rounds = rounds;
    this.pos = 0;
    this.posOut = 0;
    this.finished = false;
    this.destroyed = false;
    number(outputLen);
    if (0 >= this.blockLen || this.blockLen >= 200)
      throw new Error("Sha3 supports only keccak-f1600 function");
    this.state = new Uint8Array(200);
    this.state32 = u32(this.state);
  }
  keccak() {
    if (!isLE)
      byteSwap32(this.state32);
    keccakP(this.state32, this.rounds);
    if (!isLE)
      byteSwap32(this.state32);
    this.posOut = 0;
    this.pos = 0;
  }
  update(data) {
    exists(this);
    const { blockLen, state } = this;
    data = toBytes(data);
    const len = data.length;
    for (let pos2 = 0; pos2 < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos2);
      for (let i = 0; i < take; i++)
        state[this.pos++] ^= data[pos2++];
      if (this.pos === blockLen)
        this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    const { state, suffix, pos: pos2, blockLen } = this;
    state[pos2] ^= suffix;
    if ((suffix & 128) !== 0 && pos2 === blockLen - 1)
      this.keccak();
    state[blockLen - 1] ^= 128;
    this.keccak();
  }
  writeInto(out) {
    exists(this, false);
    bytes(out);
    this.finish();
    const bufferOut = this.state;
    const { blockLen } = this;
    for (let pos2 = 0, len = out.length; pos2 < len; ) {
      if (this.posOut >= blockLen)
        this.keccak();
      const take = Math.min(blockLen - this.posOut, len - pos2);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos2);
      this.posOut += take;
      pos2 += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF)
      throw new Error("XOF is not possible for this instance");
    return this.writeInto(out);
  }
  xof(bytes2) {
    number(bytes2);
    return this.xofInto(new Uint8Array(bytes2));
  }
  digestInto(out) {
    output(out, this);
    if (this.finished)
      throw new Error("digest() was already called");
    this.writeInto(out);
    this.destroy();
    return out;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
  destroy() {
    this.destroyed = true;
    this.state.fill(0);
  }
  _cloneInto(to) {
    const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
    to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
    to.state32.set(this.state32);
    to.pos = this.pos;
    to.posOut = this.posOut;
    to.finished = this.finished;
    to.rounds = rounds;
    to.suffix = suffix;
    to.outputLen = outputLen;
    to.enableXOF = enableXOF;
    to.destroyed = this.destroyed;
    return to;
  }
};
var gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
var sha3_256 = /* @__PURE__ */ gen(6, 136, 256 / 8);
var sha3_512 = /* @__PURE__ */ gen(6, 72, 512 / 8);
var genShake = (suffix, blockLen, outputLen) => wrapXOFConstructorWithOpts((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true));
var shake256 = /* @__PURE__ */ genShake(31, 136, 256 / 8);
var _0n$1 = BigInt(0);
var _1n$3 = BigInt(1);
var _2n$2 = BigInt(2);
var _8n = BigInt(8);
var VERIFY_DEFAULT = { zip215: true };
function validateOpts$1(curve) {
  const opts = validateBasic(curve);
  validateObject(curve, {
    hash: "function",
    a: "bigint",
    d: "bigint",
    randomBytes: "function"
  }, {
    adjustScalarBytes: "function",
    domain: "function",
    uvRatio: "function",
    mapToCurve: "function"
  });
  return Object.freeze({ ...opts });
}
function twistedEdwards(curveDef) {
  const CURVE2 = validateOpts$1(curveDef);
  const { Fp: Fp2, n: CURVE_ORDER, prehash, hash: cHash, randomBytes: randomBytes3, nByteLength, h: cofactor } = CURVE2;
  const MASK = _2n$2 << BigInt(nByteLength * 8) - _1n$3;
  const modP = Fp2.create;
  const Fn = Field(CURVE2.n, CURVE2.nBitLength);
  const uvRatio2 = CURVE2.uvRatio || ((u, v) => {
    try {
      return { isValid: true, value: Fp2.sqrt(u * Fp2.inv(v)) };
    } catch (e) {
      return { isValid: false, value: _0n$1 };
    }
  });
  const adjustScalarBytes2 = CURVE2.adjustScalarBytes || ((bytes2) => bytes2);
  const domain = CURVE2.domain || ((data, ctx, phflag) => {
    abool("phflag", phflag);
    if (ctx.length || phflag)
      throw new Error("Contexts/pre-hash are not supported");
    return data;
  });
  function aCoordinate(title, n) {
    aInRange("coordinate " + title, n, _0n$1, MASK);
  }
  function assertPoint(other) {
    if (!(other instanceof Point))
      throw new Error("ExtendedPoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { ex: x, ey: y, ez: z } = p;
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? _8n : Fp2.inv(z);
    const ax = modP(x * iz);
    const ay = modP(y * iz);
    const zz = modP(z * iz);
    if (is0)
      return { x: _0n$1, y: _1n$3 };
    if (zz !== _1n$3)
      throw new Error("invZ was invalid");
    return { x: ax, y: ay };
  });
  const assertValidMemo = memoized((p) => {
    const { a, d } = CURVE2;
    if (p.is0())
      throw new Error("bad point: ZERO");
    const { ex: X2, ey: Y2, ez: Z2, et: T } = p;
    const X22 = modP(X2 * X2);
    const Y22 = modP(Y2 * Y2);
    const Z22 = modP(Z2 * Z2);
    const Z4 = modP(Z22 * Z22);
    const aX2 = modP(X22 * a);
    const left = modP(Z22 * modP(aX2 + Y22));
    const right = modP(Z4 + modP(d * modP(X22 * Y22)));
    if (left !== right)
      throw new Error("bad point: equation left != right (1)");
    const XY = modP(X2 * Y2);
    const ZT = modP(Z2 * T);
    if (XY !== ZT)
      throw new Error("bad point: equation left != right (2)");
    return true;
  });
  class Point {
    constructor(ex, ey, ez, et2) {
      this.ex = ex;
      this.ey = ey;
      this.ez = ez;
      this.et = et2;
      aCoordinate("x", ex);
      aCoordinate("y", ey);
      aCoordinate("z", ez);
      aCoordinate("t", et2);
      Object.freeze(this);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    static fromAffine(p) {
      if (p instanceof Point)
        throw new Error("extended point not allowed");
      const { x, y } = p || {};
      aCoordinate("x", x);
      aCoordinate("y", y);
      return new Point(x, y, _1n$3, modP(x * y));
    }
    static normalizeZ(points) {
      const toInv = Fp2.invertBatch(points.map((p) => p.ez));
      return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
    }
    // Multiscalar Multiplication
    static msm(points, scalars) {
      return pippenger(Point, Fn, points, scalars);
    }
    // "Private method", don't use it directly
    _setWindowSize(windowSize) {
      wnaf.setWindowSize(this, windowSize);
    }
    // Not required for fromHex(), which always creates valid points.
    // Could be useful for fromAffine().
    assertValidity() {
      assertValidMemo(this);
    }
    // Compare one point to another.
    equals(other) {
      assertPoint(other);
      const { ex: X1, ey: Y1, ez: Z1 } = this;
      const { ex: X2, ey: Y2, ez: Z2 } = other;
      const X1Z2 = modP(X1 * Z2);
      const X2Z1 = modP(X2 * Z1);
      const Y1Z2 = modP(Y1 * Z2);
      const Y2Z1 = modP(Y2 * Z1);
      return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    negate() {
      return new Point(modP(-this.ex), this.ey, this.ez, modP(-this.et));
    }
    // Fast algo for doubling Extended Point.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
    // Cost: 4M + 4S + 1*a + 6add + 1*2.
    double() {
      const { a } = CURVE2;
      const { ex: X1, ey: Y1, ez: Z1 } = this;
      const A2 = modP(X1 * X1);
      const B = modP(Y1 * Y1);
      const C = modP(_2n$2 * modP(Z1 * Z1));
      const D3 = modP(a * A2);
      const x1y1 = X1 + Y1;
      const E = modP(modP(x1y1 * x1y1) - A2 - B);
      const G4 = D3 + B;
      const F = G4 - C;
      const H = D3 - B;
      const X3 = modP(E * F);
      const Y3 = modP(G4 * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G4);
      return new Point(X3, Y3, Z3, T3);
    }
    // Fast algo for adding 2 Extended Points.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
    // Cost: 9M + 1*a + 1*d + 7add.
    add(other) {
      assertPoint(other);
      const { a, d } = CURVE2;
      const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
      const { ex: X2, ey: Y2, ez: Z2, et: T2 } = other;
      if (a === BigInt(-1)) {
        const A3 = modP((Y1 - X1) * (Y2 + X2));
        const B2 = modP((Y1 + X1) * (Y2 - X2));
        const F2 = modP(B2 - A3);
        if (F2 === _0n$1)
          return this.double();
        const C2 = modP(Z1 * _2n$2 * T2);
        const D4 = modP(T1 * _2n$2 * Z2);
        const E2 = D4 + C2;
        const G5 = B2 + A3;
        const H2 = D4 - C2;
        const X32 = modP(E2 * F2);
        const Y32 = modP(G5 * H2);
        const T32 = modP(E2 * H2);
        const Z32 = modP(F2 * G5);
        return new Point(X32, Y32, Z32, T32);
      }
      const A2 = modP(X1 * X2);
      const B = modP(Y1 * Y2);
      const C = modP(T1 * d * T2);
      const D3 = modP(Z1 * Z2);
      const E = modP((X1 + Y1) * (X2 + Y2) - A2 - B);
      const F = D3 - C;
      const G4 = D3 + C;
      const H = modP(B - a * A2);
      const X3 = modP(E * F);
      const Y3 = modP(G4 * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G4);
      return new Point(X3, Y3, Z3, T3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    wNAF(n) {
      return wnaf.wNAFCached(this, n, Point.normalizeZ);
    }
    // Constant-time multiplication.
    multiply(scalar) {
      const n = scalar;
      aInRange("scalar", n, _1n$3, CURVE_ORDER);
      const { p, f: f2 } = this.wNAF(n);
      return Point.normalizeZ([p, f2])[0];
    }
    // Non-constant-time multiplication. Uses double-and-add algorithm.
    // It's faster, but should only be used when you don't care about
    // an exposed private key e.g. sig verification.
    // Does NOT allow scalars higher than CURVE.n.
    multiplyUnsafe(scalar) {
      const n = scalar;
      aInRange("scalar", n, _0n$1, CURVE_ORDER);
      if (n === _0n$1)
        return I2;
      if (this.equals(I2) || n === _1n$3)
        return this;
      if (this.equals(G3))
        return this.wNAF(n).p;
      return wnaf.unsafeLadder(this, n);
    }
    // Checks if point is of small order.
    // If you add something to small order point, you will have "dirty"
    // point with torsion component.
    // Multiplies point by cofactor and checks if the result is 0.
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    // Multiplies point by curve order and checks if the result is 0.
    // Returns `false` is the point is dirty.
    isTorsionFree() {
      return wnaf.unsafeLadder(this, CURVE_ORDER).is0();
    }
    // Converts Extended point to default (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    toAffine(iz) {
      return toAffineMemo(this, iz);
    }
    clearCofactor() {
      const { h: cofactor2 } = CURVE2;
      if (cofactor2 === _1n$3)
        return this;
      return this.multiplyUnsafe(cofactor2);
    }
    // Converts hash string or Uint8Array to Point.
    // Uses algo from RFC8032 5.1.3.
    static fromHex(hex, zip215 = false) {
      const { d, a } = CURVE2;
      const len = Fp2.BYTES;
      hex = ensureBytes("pointHex", hex, len);
      abool("zip215", zip215);
      const normed = hex.slice();
      const lastByte = hex[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max2 = zip215 ? MASK : Fp2.ORDER;
      aInRange("pointHex.y", y, _0n$1, max2);
      const y2 = modP(y * y);
      const u = modP(y2 - _1n$3);
      const v = modP(d * y2 - a);
      let { isValid, value: x } = uvRatio2(u, v);
      if (!isValid)
        throw new Error("Point.fromHex: invalid y coordinate");
      const isXOdd = (x & _1n$3) === _1n$3;
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && x === _0n$1 && isLastByteOdd)
        throw new Error("Point.fromHex: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = modP(-x);
      return Point.fromAffine({ x, y });
    }
    static fromPrivateKey(privKey) {
      return getExtendedPublicKey(privKey).point;
    }
    toRawBytes() {
      const { x, y } = this.toAffine();
      const bytes2 = numberToBytesLE(y, Fp2.BYTES);
      bytes2[bytes2.length - 1] |= x & _1n$3 ? 128 : 0;
      return bytes2;
    }
    toHex() {
      return bytesToHex(this.toRawBytes());
    }
  }
  Point.BASE = new Point(CURVE2.Gx, CURVE2.Gy, _1n$3, modP(CURVE2.Gx * CURVE2.Gy));
  Point.ZERO = new Point(_0n$1, _1n$3, _1n$3, _0n$1);
  const { BASE: G3, ZERO: I2 } = Point;
  const wnaf = wNAF(Point, nByteLength * 8);
  function modN(a) {
    return mod(a, CURVE_ORDER);
  }
  function modN_LE(hash2) {
    return modN(bytesToNumberLE(hash2));
  }
  function getExtendedPublicKey(key) {
    const len = nByteLength;
    key = ensureBytes("private key", key, len);
    const hashed = ensureBytes("hashed private key", cHash(key), 2 * len);
    const head = adjustScalarBytes2(hashed.slice(0, len));
    const prefix = hashed.slice(len, 2 * len);
    const scalar = modN_LE(head);
    const point = G3.multiply(scalar);
    const pointBytes = point.toRawBytes();
    return { head, prefix, scalar, point, pointBytes };
  }
  function getPublicKey(privKey) {
    return getExtendedPublicKey(privKey).pointBytes;
  }
  function hashDomainToScalar(context = new Uint8Array(), ...msgs) {
    const msg = concatBytes(...msgs);
    return modN_LE(cHash(domain(msg, ensureBytes("context", context), !!prehash)));
  }
  function sign(msg, privKey, options = {}) {
    msg = ensureBytes("message", msg);
    if (prehash)
      msg = prehash(msg);
    const { prefix, scalar, pointBytes } = getExtendedPublicKey(privKey);
    const r = hashDomainToScalar(options.context, prefix, msg);
    const R = G3.multiply(r).toRawBytes();
    const k = hashDomainToScalar(options.context, R, pointBytes, msg);
    const s = modN(r + k * scalar);
    aInRange("signature.s", s, _0n$1, CURVE_ORDER);
    const res = concatBytes(R, numberToBytesLE(s, Fp2.BYTES));
    return ensureBytes("result", res, nByteLength * 2);
  }
  const verifyOpts = VERIFY_DEFAULT;
  function verify2(sig, msg, publicKey, options = verifyOpts) {
    const { context, zip215 } = options;
    const len = Fp2.BYTES;
    sig = ensureBytes("signature", sig, 2 * len);
    msg = ensureBytes("message", msg);
    if (zip215 !== void 0)
      abool("zip215", zip215);
    if (prehash)
      msg = prehash(msg);
    const s = bytesToNumberLE(sig.slice(len, 2 * len));
    let A2, R, SB;
    try {
      A2 = Point.fromHex(publicKey, zip215);
      R = Point.fromHex(sig.slice(0, len), zip215);
      SB = G3.multiplyUnsafe(s);
    } catch (error) {
      return false;
    }
    if (!zip215 && A2.isSmallOrder())
      return false;
    const k = hashDomainToScalar(context, R.toRawBytes(), A2.toRawBytes(), msg);
    const RkA = R.add(A2.multiplyUnsafe(k));
    return RkA.subtract(SB).clearCofactor().equals(Point.ZERO);
  }
  G3._setWindowSize(8);
  const utils = {
    getExtendedPublicKey,
    // ed25519 private keys are uniform 32b. No need to check for modulo bias, like in secp256k1.
    randomPrivateKey: () => randomBytes3(Fp2.BYTES),
    /**
     * We're doing scalar multiplication (used in getPublicKey etc) with precomputed BASE_POINT
     * values. This slows down first getPublicKey() by milliseconds (see Speed section),
     * but allows to speed-up subsequent getPublicKey() calls up to 20x.
     * @param windowSize 2, 4, 8, 16
     */
    precompute(windowSize = 8, point = Point.BASE) {
      point._setWindowSize(windowSize);
      point.multiply(BigInt(3));
      return point;
    }
  };
  return {
    CURVE: CURVE2,
    getPublicKey,
    sign,
    verify: verify2,
    ExtendedPoint: Point,
    utils
  };
}
var _0n = BigInt(0);
var _1n$2 = BigInt(1);
function validateOpts(curve) {
  validateObject(curve, {
    a: "bigint"
  }, {
    montgomeryBits: "isSafeInteger",
    nByteLength: "isSafeInteger",
    adjustScalarBytes: "function",
    domain: "function",
    powPminus2: "function",
    Gu: "bigint"
  });
  return Object.freeze({ ...curve });
}
function montgomery(curveDef) {
  const CURVE2 = validateOpts(curveDef);
  const { P: P2 } = CURVE2;
  const modP = (n) => mod(n, P2);
  const montgomeryBits = CURVE2.montgomeryBits;
  const montgomeryBytes = Math.ceil(montgomeryBits / 8);
  const fieldLen = CURVE2.nByteLength;
  const adjustScalarBytes2 = CURVE2.adjustScalarBytes || ((bytes2) => bytes2);
  const powPminus2 = CURVE2.powPminus2 || ((x) => pow(x, P2 - BigInt(2), P2));
  function cswap2(swap, x_2, x_3) {
    const dummy = modP(swap * (x_2 - x_3));
    x_2 = modP(x_2 - dummy);
    x_3 = modP(x_3 + dummy);
    return [x_2, x_3];
  }
  const a24 = (CURVE2.a - BigInt(2)) / BigInt(4);
  function montgomeryLadder(u, scalar) {
    aInRange("u", u, _0n, P2);
    aInRange("scalar", scalar, _0n, P2);
    const k = scalar;
    const x_1 = u;
    let x_2 = _1n$2;
    let z_2 = _0n;
    let x_3 = u;
    let z_3 = _1n$2;
    let swap = _0n;
    let sw;
    for (let t = BigInt(montgomeryBits - 1); t >= _0n; t--) {
      const k_t = k >> t & _1n$2;
      swap ^= k_t;
      sw = cswap2(swap, x_2, x_3);
      x_2 = sw[0];
      x_3 = sw[1];
      sw = cswap2(swap, z_2, z_3);
      z_2 = sw[0];
      z_3 = sw[1];
      swap = k_t;
      const A2 = x_2 + z_2;
      const AA = modP(A2 * A2);
      const B = x_2 - z_2;
      const BB = modP(B * B);
      const E = AA - BB;
      const C = x_3 + z_3;
      const D3 = x_3 - z_3;
      const DA = modP(D3 * A2);
      const CB = modP(C * B);
      const dacb = DA + CB;
      const da_cb = DA - CB;
      x_3 = modP(dacb * dacb);
      z_3 = modP(x_1 * modP(da_cb * da_cb));
      x_2 = modP(AA * BB);
      z_2 = modP(E * (AA + modP(a24 * E)));
    }
    sw = cswap2(swap, x_2, x_3);
    x_2 = sw[0];
    x_3 = sw[1];
    sw = cswap2(swap, z_2, z_3);
    z_2 = sw[0];
    z_3 = sw[1];
    const z2 = powPminus2(z_2);
    return modP(x_2 * z2);
  }
  function encodeUCoordinate(u) {
    return numberToBytesLE(modP(u), montgomeryBytes);
  }
  function decodeUCoordinate(uEnc) {
    const u = ensureBytes("u coordinate", uEnc, montgomeryBytes);
    if (fieldLen === 32)
      u[31] &= 127;
    return bytesToNumberLE(u);
  }
  function decodeScalar(n) {
    const bytes2 = ensureBytes("scalar", n);
    const len = bytes2.length;
    if (len !== montgomeryBytes && len !== fieldLen)
      throw new Error(`Expected ${montgomeryBytes} or ${fieldLen} bytes, got ${len}`);
    return bytesToNumberLE(adjustScalarBytes2(bytes2));
  }
  function scalarMult(scalar, u) {
    const pointU = decodeUCoordinate(u);
    const _scalar = decodeScalar(scalar);
    const pu = montgomeryLadder(pointU, _scalar);
    if (pu === _0n)
      throw new Error("Invalid private or public key received");
    return encodeUCoordinate(pu);
  }
  const GuBytes = encodeUCoordinate(CURVE2.Gu);
  function scalarMultBase(scalar) {
    return scalarMult(scalar, GuBytes);
  }
  return {
    scalarMult,
    scalarMultBase,
    getSharedSecret: (privateKey, publicKey) => scalarMult(privateKey, publicKey),
    getPublicKey: (privateKey) => scalarMultBase(privateKey),
    utils: { randomPrivateKey: () => CURVE2.randomBytes(CURVE2.nByteLength) },
    GuBytes
  };
}
var shake256_114 = wrapConstructor(() => shake256.create({ dkLen: 114 }));
var shake256_64 = wrapConstructor(() => shake256.create({ dkLen: 64 }));
var ed448P = BigInt("726838724295606890549323807888004534353641360687318060281490199180612328166730772686396383698676545930088884461843637361053498018365439");
var _1n$1 = BigInt(1);
var _2n$1 = BigInt(2);
var _3n = BigInt(3);
BigInt(4);
var _11n = BigInt(11);
var _22n = BigInt(22);
var _44n = BigInt(44);
var _88n = BigInt(88);
var _223n = BigInt(223);
function ed448_pow_Pminus3div4(x) {
  const P2 = ed448P;
  const b2 = x * x * x % P2;
  const b3 = b2 * b2 * x % P2;
  const b6 = pow2(b3, _3n, P2) * b3 % P2;
  const b9 = pow2(b6, _3n, P2) * b3 % P2;
  const b11 = pow2(b9, _2n$1, P2) * b2 % P2;
  const b22 = pow2(b11, _11n, P2) * b11 % P2;
  const b44 = pow2(b22, _22n, P2) * b22 % P2;
  const b88 = pow2(b44, _44n, P2) * b44 % P2;
  const b176 = pow2(b88, _88n, P2) * b88 % P2;
  const b220 = pow2(b176, _44n, P2) * b44 % P2;
  const b222 = pow2(b220, _2n$1, P2) * b2 % P2;
  const b223 = pow2(b222, _1n$1, P2) * x % P2;
  return pow2(b223, _223n, P2) * b222 % P2;
}
function adjustScalarBytes(bytes2) {
  bytes2[0] &= 252;
  bytes2[55] |= 128;
  bytes2[56] = 0;
  return bytes2;
}
function uvRatio(u, v) {
  const P2 = ed448P;
  const u2v = mod(u * u * v, P2);
  const u3v = mod(u2v * u, P2);
  const u5v3 = mod(u3v * u2v * v, P2);
  const root = ed448_pow_Pminus3div4(u5v3);
  const x = mod(u3v * root, P2);
  const x2 = mod(x * x, P2);
  return { isValid: mod(x2 * v, P2) === u, value: x };
}
var Fp$4 = Field(ed448P, 456, true);
var ED448_DEF = {
  // Param: a
  a: BigInt(1),
  // -39081. Negative number is P - number
  d: BigInt("726838724295606890549323807888004534353641360687318060281490199180612328166730772686396383698676545930088884461843637361053498018326358"),
  // Finite field 𝔽p over which we'll do calculations; 2n**448n - 2n**224n - 1n
  Fp: Fp$4,
  // Subgroup order: how many points curve has;
  // 2n**446n - 13818066809895115352007386748515426880336692474882178609894547503885n
  n: BigInt("181709681073901722637330951972001133588410340171829515070372549795146003961539585716195755291692375963310293709091662304773755859649779"),
  // RFC 7748 has 56-byte keys, RFC 8032 has 57-byte keys
  nBitLength: 456,
  // Cofactor
  h: BigInt(4),
  // Base point (x, y) aka generator point
  Gx: BigInt("224580040295924300187604334099896036246789641632564134246125461686950415467406032909029192869357953282578032075146446173674602635247710"),
  Gy: BigInt("298819210078481492676017930443930673437544040154080242095928241372331506189835876003536878655418784733982303233503462500531545062832660"),
  // SHAKE256(dom4(phflag,context)||x, 114)
  hash: shake256_114,
  randomBytes: randomBytes2,
  adjustScalarBytes,
  // dom4
  domain: (data, ctx, phflag) => {
    if (ctx.length > 255)
      throw new Error(`Context is too big: ${ctx.length}`);
    return concatBytes$1(utf8ToBytes$1("SigEd448"), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
  },
  uvRatio
};
var ed448 = /* @__PURE__ */ twistedEdwards(ED448_DEF);
/* @__PURE__ */ twistedEdwards({ ...ED448_DEF, prehash: shake256_64 });
var x448 = /* @__PURE__ */ (() => montgomery({
  a: BigInt(156326),
  // RFC 7748 has 56-byte keys, RFC 8032 has 57-byte keys
  montgomeryBits: 448,
  nByteLength: 56,
  P: ed448P,
  Gu: BigInt(5),
  powPminus2: (x) => {
    const P2 = ed448P;
    const Pminus3div4 = ed448_pow_Pminus3div4(x);
    const Pminus3 = pow2(Pminus3div4, BigInt(2), P2);
    return mod(Pminus3 * x, P2);
  },
  adjustScalarBytes,
  randomBytes: randomBytes2
}))();
(Fp$4.ORDER - BigInt(3)) / BigInt(4);
BigInt(156326);
BigInt("39082");
BigInt("78163");
BigInt("98944233647732219769177004876929019128417576295529901074099889598043702116001257856802131563896515373927712232092845883226922417596214");
BigInt("315019913931389607337177038330951043522456072897266928557328499619017160722351061360252776265186336876723201881398623946864393857820716");
BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
var secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
var secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
var _1n = BigInt(1);
var _2n = BigInt(2);
var divNearest = (a, b) => (a + b / _2n) / b;
function sqrtMod(y) {
  const P2 = secp256k1P;
  const _3n2 = BigInt(3), _6n = BigInt(6), _11n2 = BigInt(11), _22n2 = BigInt(22);
  const _23n = BigInt(23), _44n2 = BigInt(44), _88n2 = BigInt(88);
  const b2 = y * y * y % P2;
  const b3 = b2 * b2 * y % P2;
  const b6 = pow2(b3, _3n2, P2) * b3 % P2;
  const b9 = pow2(b6, _3n2, P2) * b3 % P2;
  const b11 = pow2(b9, _2n, P2) * b2 % P2;
  const b22 = pow2(b11, _11n2, P2) * b11 % P2;
  const b44 = pow2(b22, _22n2, P2) * b22 % P2;
  const b88 = pow2(b44, _44n2, P2) * b44 % P2;
  const b176 = pow2(b88, _88n2, P2) * b88 % P2;
  const b220 = pow2(b176, _44n2, P2) * b44 % P2;
  const b223 = pow2(b220, _3n2, P2) * b3 % P2;
  const t1 = pow2(b223, _23n, P2) * b22 % P2;
  const t2 = pow2(t1, _6n, P2) * b2 % P2;
  const root = pow2(t2, _2n, P2);
  if (!Fp$3.eql(Fp$3.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fp$3 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
var secp256k1 = createCurve({
  a: BigInt(0),
  // equation params: a, b
  b: BigInt(7),
  // Seem to be rigid: bitcointalk.org/index.php?topic=289795.msg3183975#msg3183975
  Fp: Fp$3,
  // Field's prime: 2n**256n - 2n**32n - 2n**9n - 2n**8n - 2n**7n - 2n**6n - 2n**4n - 1n
  n: secp256k1N,
  // Curve order, total count of valid points in the field
  // Base point (x, y) aka generator point
  Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
  Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
  h: BigInt(1),
  // Cofactor
  lowS: true,
  // Allow only low-S signatures by default in sign() and verify()
  /**
   * secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
   * Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
   * For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
   * Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
   */
  endo: {
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
    splitScalar: (k) => {
      const n = secp256k1N;
      const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
      const b1 = -_1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
      const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
      const b2 = a1;
      const POW_2_128 = BigInt("0x100000000000000000000000000000000");
      const c1 = divNearest(b2 * k, n);
      const c2 = divNearest(-b1 * k, n);
      let k1 = mod(k - c1 * a1 - c2 * a2, n);
      let k2 = mod(-c1 * b1 - c2 * b2, n);
      const k1neg = k1 > POW_2_128;
      const k2neg = k2 > POW_2_128;
      if (k1neg)
        k1 = n - k1;
      if (k2neg)
        k2 = n - k2;
      if (k1 > POW_2_128 || k2 > POW_2_128) {
        throw new Error("splitScalar: Endomorphism failed, k=" + k);
      }
      return { k1neg, k1, k2neg, k2 };
    }
  }
}, sha256);
BigInt(0);
secp256k1.ProjectivePoint;
var Fp$2 = Field(BigInt("0xa9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377"));
var CURVE_A$2 = Fp$2.create(BigInt("0x7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9"));
var CURVE_B$2 = BigInt("0x26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6");
var brainpoolP256r1 = createCurve({
  a: CURVE_A$2,
  // Equation params: a, b
  b: CURVE_B$2,
  Fp: Fp$2,
  // Curve order (q), total count of valid points in the field
  n: BigInt("0xa9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7"),
  // Base (generator) point (x, y)
  Gx: BigInt("0x8bd2aeb9cb7e57cb2c4b482ffc81b7afb9de27e1e3bd23c23a4453bd9ace3262"),
  Gy: BigInt("0x547ef835c3dac4fd97f8461a14611dc9c27745132ded8e545c1d54c72f046997"),
  h: BigInt(1),
  lowS: false
}, sha256);
var Fp$1 = Field(BigInt("0x8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b412b1da197fb71123acd3a729901d1a71874700133107ec53"));
var CURVE_A$1 = Fp$1.create(BigInt("0x7bc382c63d8c150c3c72080ace05afa0c2bea28e4fb22787139165efba91f90f8aa5814a503ad4eb04a8c7dd22ce2826"));
var CURVE_B$1 = BigInt("0x04a8c7dd22ce28268b39b55416f0447c2fb77de107dcd2a62e880ea53eeb62d57cb4390295dbc9943ab78696fa504c11");
var brainpoolP384r1 = createCurve({
  a: CURVE_A$1,
  // Equation params: a, b
  b: CURVE_B$1,
  Fp: Fp$1,
  // Curve order (q), total count of valid points in the field
  n: BigInt("0x8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b31f166e6cac0425a7cf3ab6af6b7fc3103b883202e9046565"),
  // Base (generator) point (x, y)
  Gx: BigInt("0x1d1c64f068cf45ffa2a63a81b7c13f6b8847a3e77ef14fe3db7fcafe0cbd10e8e826e03436d646aaef87b2e247d4af1e"),
  Gy: BigInt("0x8abe1d7520f9c2a45cb1eb8e95cfd55262b70b29feec5864e19c054ff99129280e4646217791811142820341263c5315"),
  h: BigInt(1),
  lowS: false
}, sha384);
var Fp = Field(BigInt("0xaadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca703308717d4d9b009bc66842aecda12ae6a380e62881ff2f2d82c68528aa6056583a48f3"));
var CURVE_A = Fp.create(BigInt("0x7830a3318b603b89e2327145ac234cc594cbdd8d3df91610a83441caea9863bc2ded5d5aa8253aa10a2ef1c98b9ac8b57f1117a72bf2c7b9e7c1ac4d77fc94ca"));
var CURVE_B = BigInt("0x3df91610a83441caea9863bc2ded5d5aa8253aa10a2ef1c98b9ac8b57f1117a72bf2c7b9e7c1ac4d77fc94cadc083e67984050b75ebae5dd2809bd638016f723");
var brainpoolP512r1 = createCurve({
  a: CURVE_A,
  // Equation params: a, b
  b: CURVE_B,
  Fp,
  // Curve order (q), total count of valid points in the field
  n: BigInt("0xaadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca70330870553e5c414ca92619418661197fac10471db1d381085ddaddb58796829ca90069"),
  // Base (generator) point (x, y)
  Gx: BigInt("0x81aee4bdd82ed9645a21322e9c4c6a9385ed9f70b5d916c1b43b62eef4d0098eff3b1f78e2d0d48d50d1687b93b97d5f7c6d5047406a5e688b352209bcb9f822"),
  Gy: BigInt("0x7dde385d566332ecc0eabfa9cf7822fdf209f70024a57b1aa000c55b881f8111b2dcde494a5f485e5bca4bd88a2763aed1ca2b2fa8f0540678cd1e0f3ad80892"),
  h: BigInt(1),
  lowS: false
}, sha512);
var nobleCurves = new Map(Object.entries({
  nistP256: p256,
  nistP384: p384,
  nistP521: p521,
  brainpoolP256r1,
  brainpoolP384r1,
  brainpoolP512r1,
  secp256k1,
  x448,
  ed448
}));
var noble_curves = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  nobleCurves
});
var SHA1_IV = /* @__PURE__ */ new Uint32Array([
  1732584193,
  4023233417,
  2562383102,
  271733878,
  3285377520
]);
var SHA1_W = /* @__PURE__ */ new Uint32Array(80);
var SHA1 = class extends HashMD {
  constructor() {
    super(64, 20, 8, false);
    this.A = SHA1_IV[0] | 0;
    this.B = SHA1_IV[1] | 0;
    this.C = SHA1_IV[2] | 0;
    this.D = SHA1_IV[3] | 0;
    this.E = SHA1_IV[4] | 0;
  }
  get() {
    const { A: A2, B, C, D: D3, E } = this;
    return [A2, B, C, D3, E];
  }
  set(A2, B, C, D3, E) {
    this.A = A2 | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D3 | 0;
    this.E = E | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA1_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 80; i++)
      SHA1_W[i] = rotl(SHA1_W[i - 3] ^ SHA1_W[i - 8] ^ SHA1_W[i - 14] ^ SHA1_W[i - 16], 1);
    let { A: A2, B, C, D: D3, E } = this;
    for (let i = 0; i < 80; i++) {
      let F, K2;
      if (i < 20) {
        F = Chi$1(B, C, D3);
        K2 = 1518500249;
      } else if (i < 40) {
        F = B ^ C ^ D3;
        K2 = 1859775393;
      } else if (i < 60) {
        F = Maj(B, C, D3);
        K2 = 2400959708;
      } else {
        F = B ^ C ^ D3;
        K2 = 3395469782;
      }
      const T = rotl(A2, 5) + F + E + K2 + SHA1_W[i] | 0;
      E = D3;
      D3 = C;
      C = rotl(B, 30);
      B = A2;
      A2 = T;
    }
    A2 = A2 + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D3 = D3 + this.D | 0;
    E = E + this.E | 0;
    this.set(A2, B, C, D3, E);
  }
  roundClean() {
    SHA1_W.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0);
    this.buffer.fill(0);
  }
};
var sha1 = /* @__PURE__ */ wrapConstructor(() => new SHA1());
var Rho = /* @__PURE__ */ new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]);
var Id = /* @__PURE__ */ new Uint8Array(new Array(16).fill(0).map((_, i) => i));
var Pi = /* @__PURE__ */ Id.map((i) => (9 * i + 5) % 16);
var idxL = [Id];
var idxR = [Pi];
for (let i = 0; i < 4; i++)
  for (let j of [idxL, idxR])
    j.push(j[i].map((k) => Rho[k]));
var shifts = /* @__PURE__ */ [
  [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
  [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
  [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
  [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
  [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
].map((i) => new Uint8Array(i));
var shiftsL = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts[i][j]));
var shiftsR = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts[i][j]));
var Kl = /* @__PURE__ */ new Uint32Array([
  0,
  1518500249,
  1859775393,
  2400959708,
  2840853838
]);
var Kr = /* @__PURE__ */ new Uint32Array([
  1352829926,
  1548603684,
  1836072691,
  2053994217,
  0
]);
function f(group, x, y, z) {
  if (group === 0)
    return x ^ y ^ z;
  else if (group === 1)
    return x & y | ~x & z;
  else if (group === 2)
    return (x | ~y) ^ z;
  else if (group === 3)
    return x & z | y & ~z;
  else
    return x ^ (y | ~z);
}
var R_BUF = /* @__PURE__ */ new Uint32Array(16);
var RIPEMD160 = class extends HashMD {
  constructor() {
    super(64, 20, 8, true);
    this.h0 = 1732584193 | 0;
    this.h1 = 4023233417 | 0;
    this.h2 = 2562383102 | 0;
    this.h3 = 271733878 | 0;
    this.h4 = 3285377520 | 0;
  }
  get() {
    const { h0, h1, h2, h3, h4 } = this;
    return [h0, h1, h2, h3, h4];
  }
  set(h0, h1, h2, h3, h4) {
    this.h0 = h0 | 0;
    this.h1 = h1 | 0;
    this.h2 = h2 | 0;
    this.h3 = h3 | 0;
    this.h4 = h4 | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      R_BUF[i] = view.getUint32(offset, true);
    let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
    for (let group = 0; group < 5; group++) {
      const rGroup = 4 - group;
      const hbl = Kl[group], hbr = Kr[group];
      const rl = idxL[group], rr = idxR[group];
      const sl = shiftsL[group], sr = shiftsR[group];
      for (let i = 0; i < 16; i++) {
        const tl = rotl(al + f(group, bl, cl, dl) + R_BUF[rl[i]] + hbl, sl[i]) + el | 0;
        al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
      }
      for (let i = 0; i < 16; i++) {
        const tr = rotl(ar + f(rGroup, br, cr, dr) + R_BUF[rr[i]] + hbr, sr[i]) + er | 0;
        ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
      }
    }
    this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
  }
  roundClean() {
    R_BUF.fill(0);
  }
  destroy() {
    this.destroyed = true;
    this.buffer.fill(0);
    this.set(0, 0, 0, 0, 0);
  }
};
var ripemd160 = /* @__PURE__ */ wrapConstructor(() => new RIPEMD160());
var K = Array.from({ length: 64 }, (_, i) => Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))));
var Chi = (a, b, c) => a & b ^ ~a & c;
var IV = /* @__PURE__ */ new Uint32Array([1732584193, 4023233417, 2562383102, 271733878]);
var MD5_W = /* @__PURE__ */ new Uint32Array(16);
var MD5 = class extends HashMD {
  constructor() {
    super(64, 16, 8, true);
    this.A = IV[0] | 0;
    this.B = IV[1] | 0;
    this.C = IV[2] | 0;
    this.D = IV[3] | 0;
  }
  get() {
    const { A: A2, B, C, D: D3 } = this;
    return [A2, B, C, D3];
  }
  set(A2, B, C, D3) {
    this.A = A2 | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D3 | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      MD5_W[i] = view.getUint32(offset, true);
    let { A: A2, B, C, D: D3 } = this;
    for (let i = 0; i < 64; i++) {
      let F, g, s;
      if (i < 16) {
        F = Chi(B, C, D3);
        g = i;
        s = [7, 12, 17, 22];
      } else if (i < 32) {
        F = Chi(D3, B, C);
        g = (5 * i + 1) % 16;
        s = [5, 9, 14, 20];
      } else if (i < 48) {
        F = B ^ C ^ D3;
        g = (3 * i + 5) % 16;
        s = [4, 11, 16, 23];
      } else {
        F = C ^ (B | ~D3);
        g = 7 * i % 16;
        s = [6, 10, 15, 21];
      }
      F = F + A2 + K[i] + MD5_W[g];
      A2 = D3;
      D3 = C;
      C = B;
      B = B + rotl(F, s[i % 4]);
    }
    A2 = A2 + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D3 = D3 + this.D | 0;
    this.set(A2, B, C, D3);
  }
  roundClean() {
    MD5_W.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0);
    this.buffer.fill(0);
  }
};
var md5 = /* @__PURE__ */ wrapConstructor(() => new MD5());
var nobleHashes = new Map(Object.entries({
  md5,
  sha1,
  sha224,
  sha256,
  sha384,
  sha512,
  sha3_256,
  sha3_512,
  ripemd160
}));
var noble_hashes = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  nobleHashes
});
function des(keys, message, encrypt, mode, iv, padding) {
  const spfunction1 = [
    16843776,
    0,
    65536,
    16843780,
    16842756,
    66564,
    4,
    65536,
    1024,
    16843776,
    16843780,
    1024,
    16778244,
    16842756,
    16777216,
    4,
    1028,
    16778240,
    16778240,
    66560,
    66560,
    16842752,
    16842752,
    16778244,
    65540,
    16777220,
    16777220,
    65540,
    0,
    1028,
    66564,
    16777216,
    65536,
    16843780,
    4,
    16842752,
    16843776,
    16777216,
    16777216,
    1024,
    16842756,
    65536,
    66560,
    16777220,
    1024,
    4,
    16778244,
    66564,
    16843780,
    65540,
    16842752,
    16778244,
    16777220,
    1028,
    66564,
    16843776,
    1028,
    16778240,
    16778240,
    0,
    65540,
    66560,
    0,
    16842756
  ];
  const spfunction2 = [
    -2146402272,
    -2147450880,
    32768,
    1081376,
    1048576,
    32,
    -2146435040,
    -2147450848,
    -2147483616,
    -2146402272,
    -2146402304,
    -2147483648,
    -2147450880,
    1048576,
    32,
    -2146435040,
    1081344,
    1048608,
    -2147450848,
    0,
    -2147483648,
    32768,
    1081376,
    -2146435072,
    1048608,
    -2147483616,
    0,
    1081344,
    32800,
    -2146402304,
    -2146435072,
    32800,
    0,
    1081376,
    -2146435040,
    1048576,
    -2147450848,
    -2146435072,
    -2146402304,
    32768,
    -2146435072,
    -2147450880,
    32,
    -2146402272,
    1081376,
    32,
    32768,
    -2147483648,
    32800,
    -2146402304,
    1048576,
    -2147483616,
    1048608,
    -2147450848,
    -2147483616,
    1048608,
    1081344,
    0,
    -2147450880,
    32800,
    -2147483648,
    -2146435040,
    -2146402272,
    1081344
  ];
  const spfunction3 = [
    520,
    134349312,
    0,
    134348808,
    134218240,
    0,
    131592,
    134218240,
    131080,
    134217736,
    134217736,
    131072,
    134349320,
    131080,
    134348800,
    520,
    134217728,
    8,
    134349312,
    512,
    131584,
    134348800,
    134348808,
    131592,
    134218248,
    131584,
    131072,
    134218248,
    8,
    134349320,
    512,
    134217728,
    134349312,
    134217728,
    131080,
    520,
    131072,
    134349312,
    134218240,
    0,
    512,
    131080,
    134349320,
    134218240,
    134217736,
    512,
    0,
    134348808,
    134218248,
    131072,
    134217728,
    134349320,
    8,
    131592,
    131584,
    134217736,
    134348800,
    134218248,
    520,
    134348800,
    131592,
    8,
    134348808,
    131584
  ];
  const spfunction4 = [
    8396801,
    8321,
    8321,
    128,
    8396928,
    8388737,
    8388609,
    8193,
    0,
    8396800,
    8396800,
    8396929,
    129,
    0,
    8388736,
    8388609,
    1,
    8192,
    8388608,
    8396801,
    128,
    8388608,
    8193,
    8320,
    8388737,
    1,
    8320,
    8388736,
    8192,
    8396928,
    8396929,
    129,
    8388736,
    8388609,
    8396800,
    8396929,
    129,
    0,
    0,
    8396800,
    8320,
    8388736,
    8388737,
    1,
    8396801,
    8321,
    8321,
    128,
    8396929,
    129,
    1,
    8192,
    8388609,
    8193,
    8396928,
    8388737,
    8193,
    8320,
    8388608,
    8396801,
    128,
    8388608,
    8192,
    8396928
  ];
  const spfunction5 = [
    256,
    34078976,
    34078720,
    1107296512,
    524288,
    256,
    1073741824,
    34078720,
    1074266368,
    524288,
    33554688,
    1074266368,
    1107296512,
    1107820544,
    524544,
    1073741824,
    33554432,
    1074266112,
    1074266112,
    0,
    1073742080,
    1107820800,
    1107820800,
    33554688,
    1107820544,
    1073742080,
    0,
    1107296256,
    34078976,
    33554432,
    1107296256,
    524544,
    524288,
    1107296512,
    256,
    33554432,
    1073741824,
    34078720,
    1107296512,
    1074266368,
    33554688,
    1073741824,
    1107820544,
    34078976,
    1074266368,
    256,
    33554432,
    1107820544,
    1107820800,
    524544,
    1107296256,
    1107820800,
    34078720,
    0,
    1074266112,
    1107296256,
    524544,
    33554688,
    1073742080,
    524288,
    0,
    1074266112,
    34078976,
    1073742080
  ];
  const spfunction6 = [
    536870928,
    541065216,
    16384,
    541081616,
    541065216,
    16,
    541081616,
    4194304,
    536887296,
    4210704,
    4194304,
    536870928,
    4194320,
    536887296,
    536870912,
    16400,
    0,
    4194320,
    536887312,
    16384,
    4210688,
    536887312,
    16,
    541065232,
    541065232,
    0,
    4210704,
    541081600,
    16400,
    4210688,
    541081600,
    536870912,
    536887296,
    16,
    541065232,
    4210688,
    541081616,
    4194304,
    16400,
    536870928,
    4194304,
    536887296,
    536870912,
    16400,
    536870928,
    541081616,
    4210688,
    541065216,
    4210704,
    541081600,
    0,
    541065232,
    16,
    16384,
    541065216,
    4210704,
    16384,
    4194320,
    536887312,
    0,
    541081600,
    536870912,
    4194320,
    536887312
  ];
  const spfunction7 = [
    2097152,
    69206018,
    67110914,
    0,
    2048,
    67110914,
    2099202,
    69208064,
    69208066,
    2097152,
    0,
    67108866,
    2,
    67108864,
    69206018,
    2050,
    67110912,
    2099202,
    2097154,
    67110912,
    67108866,
    69206016,
    69208064,
    2097154,
    69206016,
    2048,
    2050,
    69208066,
    2099200,
    2,
    67108864,
    2099200,
    67108864,
    2099200,
    2097152,
    67110914,
    67110914,
    69206018,
    69206018,
    2,
    2097154,
    67108864,
    67110912,
    2097152,
    69208064,
    2050,
    2099202,
    69208064,
    2050,
    67108866,
    69208066,
    69206016,
    2099200,
    0,
    2,
    69208066,
    0,
    2099202,
    69206016,
    2048,
    67108866,
    67110912,
    2048,
    2097154
  ];
  const spfunction8 = [
    268439616,
    4096,
    262144,
    268701760,
    268435456,
    268439616,
    64,
    268435456,
    262208,
    268697600,
    268701760,
    266240,
    268701696,
    266304,
    4096,
    64,
    268697600,
    268435520,
    268439552,
    4160,
    266240,
    262208,
    268697664,
    268701696,
    4160,
    0,
    0,
    268697664,
    268435520,
    268439552,
    266304,
    262144,
    266304,
    262144,
    268701696,
    4096,
    64,
    268697664,
    4096,
    266304,
    268439552,
    64,
    268435520,
    268697600,
    268697664,
    268435456,
    262144,
    268439616,
    0,
    268701760,
    262208,
    268435520,
    268697600,
    268439552,
    268439616,
    0,
    268701760,
    266240,
    266240,
    4160,
    4160,
    262208,
    268435456,
    268701696
  ];
  let m = 0;
  let i;
  let j;
  let temp;
  let right1;
  let right2;
  let left;
  let right;
  let looping;
  let endloop;
  let loopinc;
  let len = message.length;
  const iterations = keys.length === 32 ? 3 : 9;
  if (iterations === 3) {
    looping = encrypt ? [0, 32, 2] : [30, -2, -2];
  } else {
    looping = encrypt ? [0, 32, 2, 62, 30, -2, 64, 96, 2] : [94, 62, -2, 32, 64, 2, 30, -2, -2];
  }
  if (encrypt) {
    message = desAddPadding(message);
    len = message.length;
  }
  let result = new Uint8Array(len);
  let k = 0;
  while (m < len) {
    left = message[m++] << 24 | message[m++] << 16 | message[m++] << 8 | message[m++];
    right = message[m++] << 24 | message[m++] << 16 | message[m++] << 8 | message[m++];
    temp = (left >>> 4 ^ right) & 252645135;
    right ^= temp;
    left ^= temp << 4;
    temp = (left >>> 16 ^ right) & 65535;
    right ^= temp;
    left ^= temp << 16;
    temp = (right >>> 2 ^ left) & 858993459;
    left ^= temp;
    right ^= temp << 2;
    temp = (right >>> 8 ^ left) & 16711935;
    left ^= temp;
    right ^= temp << 8;
    temp = (left >>> 1 ^ right) & 1431655765;
    right ^= temp;
    left ^= temp << 1;
    left = left << 1 | left >>> 31;
    right = right << 1 | right >>> 31;
    for (j = 0; j < iterations; j += 3) {
      endloop = looping[j + 1];
      loopinc = looping[j + 2];
      for (i = looping[j]; i !== endloop; i += loopinc) {
        right1 = right ^ keys[i];
        right2 = (right >>> 4 | right << 28) ^ keys[i + 1];
        temp = left;
        left = right;
        right = temp ^ (spfunction2[right1 >>> 24 & 63] | spfunction4[right1 >>> 16 & 63] | spfunction6[right1 >>> 8 & 63] | spfunction8[right1 & 63] | spfunction1[right2 >>> 24 & 63] | spfunction3[right2 >>> 16 & 63] | spfunction5[right2 >>> 8 & 63] | spfunction7[right2 & 63]);
      }
      temp = left;
      left = right;
      right = temp;
    }
    left = left >>> 1 | left << 31;
    right = right >>> 1 | right << 31;
    temp = (left >>> 1 ^ right) & 1431655765;
    right ^= temp;
    left ^= temp << 1;
    temp = (right >>> 8 ^ left) & 16711935;
    left ^= temp;
    right ^= temp << 8;
    temp = (right >>> 2 ^ left) & 858993459;
    left ^= temp;
    right ^= temp << 2;
    temp = (left >>> 16 ^ right) & 65535;
    right ^= temp;
    left ^= temp << 16;
    temp = (left >>> 4 ^ right) & 252645135;
    right ^= temp;
    left ^= temp << 4;
    result[k++] = left >>> 24;
    result[k++] = left >>> 16 & 255;
    result[k++] = left >>> 8 & 255;
    result[k++] = left & 255;
    result[k++] = right >>> 24;
    result[k++] = right >>> 16 & 255;
    result[k++] = right >>> 8 & 255;
    result[k++] = right & 255;
  }
  if (!encrypt) {
    result = desRemovePadding(result);
  }
  return result;
}
function desCreateKeys(key) {
  const pc2bytes0 = [
    0,
    4,
    536870912,
    536870916,
    65536,
    65540,
    536936448,
    536936452,
    512,
    516,
    536871424,
    536871428,
    66048,
    66052,
    536936960,
    536936964
  ];
  const pc2bytes1 = [
    0,
    1,
    1048576,
    1048577,
    67108864,
    67108865,
    68157440,
    68157441,
    256,
    257,
    1048832,
    1048833,
    67109120,
    67109121,
    68157696,
    68157697
  ];
  const pc2bytes2 = [
    0,
    8,
    2048,
    2056,
    16777216,
    16777224,
    16779264,
    16779272,
    0,
    8,
    2048,
    2056,
    16777216,
    16777224,
    16779264,
    16779272
  ];
  const pc2bytes3 = [
    0,
    2097152,
    134217728,
    136314880,
    8192,
    2105344,
    134225920,
    136323072,
    131072,
    2228224,
    134348800,
    136445952,
    139264,
    2236416,
    134356992,
    136454144
  ];
  const pc2bytes4 = [
    0,
    262144,
    16,
    262160,
    0,
    262144,
    16,
    262160,
    4096,
    266240,
    4112,
    266256,
    4096,
    266240,
    4112,
    266256
  ];
  const pc2bytes5 = [
    0,
    1024,
    32,
    1056,
    0,
    1024,
    32,
    1056,
    33554432,
    33555456,
    33554464,
    33555488,
    33554432,
    33555456,
    33554464,
    33555488
  ];
  const pc2bytes6 = [
    0,
    268435456,
    524288,
    268959744,
    2,
    268435458,
    524290,
    268959746,
    0,
    268435456,
    524288,
    268959744,
    2,
    268435458,
    524290,
    268959746
  ];
  const pc2bytes7 = [
    0,
    65536,
    2048,
    67584,
    536870912,
    536936448,
    536872960,
    536938496,
    131072,
    196608,
    133120,
    198656,
    537001984,
    537067520,
    537004032,
    537069568
  ];
  const pc2bytes8 = [
    0,
    262144,
    0,
    262144,
    2,
    262146,
    2,
    262146,
    33554432,
    33816576,
    33554432,
    33816576,
    33554434,
    33816578,
    33554434,
    33816578
  ];
  const pc2bytes9 = [
    0,
    268435456,
    8,
    268435464,
    0,
    268435456,
    8,
    268435464,
    1024,
    268436480,
    1032,
    268436488,
    1024,
    268436480,
    1032,
    268436488
  ];
  const pc2bytes10 = [
    0,
    32,
    0,
    32,
    1048576,
    1048608,
    1048576,
    1048608,
    8192,
    8224,
    8192,
    8224,
    1056768,
    1056800,
    1056768,
    1056800
  ];
  const pc2bytes11 = [
    0,
    16777216,
    512,
    16777728,
    2097152,
    18874368,
    2097664,
    18874880,
    67108864,
    83886080,
    67109376,
    83886592,
    69206016,
    85983232,
    69206528,
    85983744
  ];
  const pc2bytes12 = [
    0,
    4096,
    134217728,
    134221824,
    524288,
    528384,
    134742016,
    134746112,
    16,
    4112,
    134217744,
    134221840,
    524304,
    528400,
    134742032,
    134746128
  ];
  const pc2bytes13 = [0, 4, 256, 260, 0, 4, 256, 260, 1, 5, 257, 261, 1, 5, 257, 261];
  const iterations = key.length > 8 ? 3 : 1;
  const keys = new Array(32 * iterations);
  const shifts2 = [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0];
  let lefttemp;
  let righttemp;
  let m = 0;
  let n = 0;
  let temp;
  for (let j = 0; j < iterations; j++) {
    let left = key[m++] << 24 | key[m++] << 16 | key[m++] << 8 | key[m++];
    let right = key[m++] << 24 | key[m++] << 16 | key[m++] << 8 | key[m++];
    temp = (left >>> 4 ^ right) & 252645135;
    right ^= temp;
    left ^= temp << 4;
    temp = (right >>> -16 ^ left) & 65535;
    left ^= temp;
    right ^= temp << -16;
    temp = (left >>> 2 ^ right) & 858993459;
    right ^= temp;
    left ^= temp << 2;
    temp = (right >>> -16 ^ left) & 65535;
    left ^= temp;
    right ^= temp << -16;
    temp = (left >>> 1 ^ right) & 1431655765;
    right ^= temp;
    left ^= temp << 1;
    temp = (right >>> 8 ^ left) & 16711935;
    left ^= temp;
    right ^= temp << 8;
    temp = (left >>> 1 ^ right) & 1431655765;
    right ^= temp;
    left ^= temp << 1;
    temp = left << 8 | right >>> 20 & 240;
    left = right << 24 | right << 8 & 16711680 | right >>> 8 & 65280 | right >>> 24 & 240;
    right = temp;
    for (let i = 0; i < shifts2.length; i++) {
      if (shifts2[i]) {
        left = left << 2 | left >>> 26;
        right = right << 2 | right >>> 26;
      } else {
        left = left << 1 | left >>> 27;
        right = right << 1 | right >>> 27;
      }
      left &= -15;
      right &= -15;
      lefttemp = pc2bytes0[left >>> 28] | pc2bytes1[left >>> 24 & 15] | pc2bytes2[left >>> 20 & 15] | pc2bytes3[left >>> 16 & 15] | pc2bytes4[left >>> 12 & 15] | pc2bytes5[left >>> 8 & 15] | pc2bytes6[left >>> 4 & 15];
      righttemp = pc2bytes7[right >>> 28] | pc2bytes8[right >>> 24 & 15] | pc2bytes9[right >>> 20 & 15] | pc2bytes10[right >>> 16 & 15] | pc2bytes11[right >>> 12 & 15] | pc2bytes12[right >>> 8 & 15] | pc2bytes13[right >>> 4 & 15];
      temp = (righttemp >>> 16 ^ lefttemp) & 65535;
      keys[n++] = lefttemp ^ temp;
      keys[n++] = righttemp ^ temp << 16;
    }
  }
  return keys;
}
function desAddPadding(message, padding) {
  const padLength = 8 - message.length % 8;
  let pad2;
  if (padLength < 8) {
    pad2 = 0;
  } else if (padLength === 8) {
    return message;
  } else {
    throw new Error("des: invalid padding");
  }
  const paddedMessage = new Uint8Array(message.length + padLength);
  for (let i = 0; i < message.length; i++) {
    paddedMessage[i] = message[i];
  }
  for (let j = 0; j < padLength; j++) {
    paddedMessage[message.length + j] = pad2;
  }
  return paddedMessage;
}
function desRemovePadding(message, padding) {
  let padLength = null;
  let pad2;
  {
    pad2 = 0;
  }
  if (!padLength) {
    padLength = 1;
    while (message[message.length - padLength] === pad2) {
      padLength++;
    }
    padLength--;
  }
  return message.subarray(0, message.length - padLength);
}
function TripleDES(key) {
  this.key = [];
  for (let i = 0; i < 3; i++) {
    this.key.push(new Uint8Array(key.subarray(i * 8, i * 8 + 8)));
  }
  this.encrypt = function(block) {
    return des(
      desCreateKeys(this.key[2]),
      des(
        desCreateKeys(this.key[1]),
        des(
          desCreateKeys(this.key[0]),
          block,
          true,
          0,
          null,
          null
        ),
        false,
        0,
        null,
        null
      ),
      true
    );
  };
}
TripleDES.keySize = TripleDES.prototype.keySize = 24;
TripleDES.blockSize = TripleDES.prototype.blockSize = 8;
function OpenPGPSymEncCAST5() {
  this.BlockSize = 8;
  this.KeySize = 16;
  this.setKey = function(key) {
    this.masking = new Array(16);
    this.rotate = new Array(16);
    this.reset();
    if (key.length === this.KeySize) {
      this.keySchedule(key);
    } else {
      throw new Error("CAST-128: keys must be 16 bytes");
    }
    return true;
  };
  this.reset = function() {
    for (let i = 0; i < 16; i++) {
      this.masking[i] = 0;
      this.rotate[i] = 0;
    }
  };
  this.getBlockSize = function() {
    return this.BlockSize;
  };
  this.encrypt = function(src) {
    const dst = new Array(src.length);
    for (let i = 0; i < src.length; i += 8) {
      let l = src[i] << 24 | src[i + 1] << 16 | src[i + 2] << 8 | src[i + 3];
      let r = src[i + 4] << 24 | src[i + 5] << 16 | src[i + 6] << 8 | src[i + 7];
      let t;
      t = r;
      r = l ^ f1(r, this.masking[0], this.rotate[0]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[1], this.rotate[1]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[2], this.rotate[2]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[3], this.rotate[3]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[4], this.rotate[4]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[5], this.rotate[5]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[6], this.rotate[6]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[7], this.rotate[7]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[8], this.rotate[8]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[9], this.rotate[9]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[10], this.rotate[10]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[11], this.rotate[11]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[12], this.rotate[12]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[13], this.rotate[13]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[14], this.rotate[14]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[15], this.rotate[15]);
      l = t;
      dst[i] = r >>> 24 & 255;
      dst[i + 1] = r >>> 16 & 255;
      dst[i + 2] = r >>> 8 & 255;
      dst[i + 3] = r & 255;
      dst[i + 4] = l >>> 24 & 255;
      dst[i + 5] = l >>> 16 & 255;
      dst[i + 6] = l >>> 8 & 255;
      dst[i + 7] = l & 255;
    }
    return dst;
  };
  this.decrypt = function(src) {
    const dst = new Array(src.length);
    for (let i = 0; i < src.length; i += 8) {
      let l = src[i] << 24 | src[i + 1] << 16 | src[i + 2] << 8 | src[i + 3];
      let r = src[i + 4] << 24 | src[i + 5] << 16 | src[i + 6] << 8 | src[i + 7];
      let t;
      t = r;
      r = l ^ f1(r, this.masking[15], this.rotate[15]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[14], this.rotate[14]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[13], this.rotate[13]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[12], this.rotate[12]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[11], this.rotate[11]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[10], this.rotate[10]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[9], this.rotate[9]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[8], this.rotate[8]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[7], this.rotate[7]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[6], this.rotate[6]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[5], this.rotate[5]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[4], this.rotate[4]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[3], this.rotate[3]);
      l = t;
      t = r;
      r = l ^ f3(r, this.masking[2], this.rotate[2]);
      l = t;
      t = r;
      r = l ^ f2(r, this.masking[1], this.rotate[1]);
      l = t;
      t = r;
      r = l ^ f1(r, this.masking[0], this.rotate[0]);
      l = t;
      dst[i] = r >>> 24 & 255;
      dst[i + 1] = r >>> 16 & 255;
      dst[i + 2] = r >>> 8 & 255;
      dst[i + 3] = r & 255;
      dst[i + 4] = l >>> 24 & 255;
      dst[i + 5] = l >> 16 & 255;
      dst[i + 6] = l >> 8 & 255;
      dst[i + 7] = l & 255;
    }
    return dst;
  };
  const scheduleA = new Array(4);
  scheduleA[0] = new Array(4);
  scheduleA[0][0] = [4, 0, 13, 15, 12, 14, 8];
  scheduleA[0][1] = [5, 2, 16 + 0, 16 + 2, 16 + 1, 16 + 3, 10];
  scheduleA[0][2] = [6, 3, 16 + 7, 16 + 6, 16 + 5, 16 + 4, 9];
  scheduleA[0][3] = [7, 1, 16 + 10, 16 + 9, 16 + 11, 16 + 8, 11];
  scheduleA[1] = new Array(4);
  scheduleA[1][0] = [0, 6, 16 + 5, 16 + 7, 16 + 4, 16 + 6, 16 + 0];
  scheduleA[1][1] = [1, 4, 0, 2, 1, 3, 16 + 2];
  scheduleA[1][2] = [2, 5, 7, 6, 5, 4, 16 + 1];
  scheduleA[1][3] = [3, 7, 10, 9, 11, 8, 16 + 3];
  scheduleA[2] = new Array(4);
  scheduleA[2][0] = [4, 0, 13, 15, 12, 14, 8];
  scheduleA[2][1] = [5, 2, 16 + 0, 16 + 2, 16 + 1, 16 + 3, 10];
  scheduleA[2][2] = [6, 3, 16 + 7, 16 + 6, 16 + 5, 16 + 4, 9];
  scheduleA[2][3] = [7, 1, 16 + 10, 16 + 9, 16 + 11, 16 + 8, 11];
  scheduleA[3] = new Array(4);
  scheduleA[3][0] = [0, 6, 16 + 5, 16 + 7, 16 + 4, 16 + 6, 16 + 0];
  scheduleA[3][1] = [1, 4, 0, 2, 1, 3, 16 + 2];
  scheduleA[3][2] = [2, 5, 7, 6, 5, 4, 16 + 1];
  scheduleA[3][3] = [3, 7, 10, 9, 11, 8, 16 + 3];
  const scheduleB = new Array(4);
  scheduleB[0] = new Array(4);
  scheduleB[0][0] = [16 + 8, 16 + 9, 16 + 7, 16 + 6, 16 + 2];
  scheduleB[0][1] = [16 + 10, 16 + 11, 16 + 5, 16 + 4, 16 + 6];
  scheduleB[0][2] = [16 + 12, 16 + 13, 16 + 3, 16 + 2, 16 + 9];
  scheduleB[0][3] = [16 + 14, 16 + 15, 16 + 1, 16 + 0, 16 + 12];
  scheduleB[1] = new Array(4);
  scheduleB[1][0] = [3, 2, 12, 13, 8];
  scheduleB[1][1] = [1, 0, 14, 15, 13];
  scheduleB[1][2] = [7, 6, 8, 9, 3];
  scheduleB[1][3] = [5, 4, 10, 11, 7];
  scheduleB[2] = new Array(4);
  scheduleB[2][0] = [16 + 3, 16 + 2, 16 + 12, 16 + 13, 16 + 9];
  scheduleB[2][1] = [16 + 1, 16 + 0, 16 + 14, 16 + 15, 16 + 12];
  scheduleB[2][2] = [16 + 7, 16 + 6, 16 + 8, 16 + 9, 16 + 2];
  scheduleB[2][3] = [16 + 5, 16 + 4, 16 + 10, 16 + 11, 16 + 6];
  scheduleB[3] = new Array(4);
  scheduleB[3][0] = [8, 9, 7, 6, 3];
  scheduleB[3][1] = [10, 11, 5, 4, 7];
  scheduleB[3][2] = [12, 13, 3, 2, 8];
  scheduleB[3][3] = [14, 15, 1, 0, 13];
  this.keySchedule = function(inn) {
    const t = new Array(8);
    const k = new Array(32);
    let j;
    for (let i = 0; i < 4; i++) {
      j = i * 4;
      t[i] = inn[j] << 24 | inn[j + 1] << 16 | inn[j + 2] << 8 | inn[j + 3];
    }
    const x = [6, 7, 4, 5];
    let ki = 0;
    let w;
    for (let half = 0; half < 2; half++) {
      for (let round = 0; round < 4; round++) {
        for (j = 0; j < 4; j++) {
          const a = scheduleA[round][j];
          w = t[a[1]];
          w ^= sBox[4][t[a[2] >>> 2] >>> 24 - 8 * (a[2] & 3) & 255];
          w ^= sBox[5][t[a[3] >>> 2] >>> 24 - 8 * (a[3] & 3) & 255];
          w ^= sBox[6][t[a[4] >>> 2] >>> 24 - 8 * (a[4] & 3) & 255];
          w ^= sBox[7][t[a[5] >>> 2] >>> 24 - 8 * (a[5] & 3) & 255];
          w ^= sBox[x[j]][t[a[6] >>> 2] >>> 24 - 8 * (a[6] & 3) & 255];
          t[a[0]] = w;
        }
        for (j = 0; j < 4; j++) {
          const b = scheduleB[round][j];
          w = sBox[4][t[b[0] >>> 2] >>> 24 - 8 * (b[0] & 3) & 255];
          w ^= sBox[5][t[b[1] >>> 2] >>> 24 - 8 * (b[1] & 3) & 255];
          w ^= sBox[6][t[b[2] >>> 2] >>> 24 - 8 * (b[2] & 3) & 255];
          w ^= sBox[7][t[b[3] >>> 2] >>> 24 - 8 * (b[3] & 3) & 255];
          w ^= sBox[4 + j][t[b[4] >>> 2] >>> 24 - 8 * (b[4] & 3) & 255];
          k[ki] = w;
          ki++;
        }
      }
    }
    for (let i = 0; i < 16; i++) {
      this.masking[i] = k[i];
      this.rotate[i] = k[16 + i] & 31;
    }
  };
  function f1(d, m, r) {
    const t = m + d;
    const I2 = t << r | t >>> 32 - r;
    return (sBox[0][I2 >>> 24] ^ sBox[1][I2 >>> 16 & 255]) - sBox[2][I2 >>> 8 & 255] + sBox[3][I2 & 255];
  }
  function f2(d, m, r) {
    const t = m ^ d;
    const I2 = t << r | t >>> 32 - r;
    return sBox[0][I2 >>> 24] - sBox[1][I2 >>> 16 & 255] + sBox[2][I2 >>> 8 & 255] ^ sBox[3][I2 & 255];
  }
  function f3(d, m, r) {
    const t = m - d;
    const I2 = t << r | t >>> 32 - r;
    return (sBox[0][I2 >>> 24] + sBox[1][I2 >>> 16 & 255] ^ sBox[2][I2 >>> 8 & 255]) - sBox[3][I2 & 255];
  }
  const sBox = new Array(8);
  sBox[0] = [
    821772500,
    2678128395,
    1810681135,
    1059425402,
    505495343,
    2617265619,
    1610868032,
    3483355465,
    3218386727,
    2294005173,
    3791863952,
    2563806837,
    1852023008,
    365126098,
    3269944861,
    584384398,
    677919599,
    3229601881,
    4280515016,
    2002735330,
    1136869587,
    3744433750,
    2289869850,
    2731719981,
    2714362070,
    879511577,
    1639411079,
    575934255,
    717107937,
    2857637483,
    576097850,
    2731753936,
    1725645e3,
    2810460463,
    5111599,
    767152862,
    2543075244,
    1251459544,
    1383482551,
    3052681127,
    3089939183,
    3612463449,
    1878520045,
    1510570527,
    2189125840,
    2431448366,
    582008916,
    3163445557,
    1265446783,
    1354458274,
    3529918736,
    3202711853,
    3073581712,
    3912963487,
    3029263377,
    1275016285,
    4249207360,
    2905708351,
    3304509486,
    1442611557,
    3585198765,
    2712415662,
    2731849581,
    3248163920,
    2283946226,
    208555832,
    2766454743,
    1331405426,
    1447828783,
    3315356441,
    3108627284,
    2957404670,
    2981538698,
    3339933917,
    1669711173,
    286233437,
    1465092821,
    1782121619,
    3862771680,
    710211251,
    980974943,
    1651941557,
    430374111,
    2051154026,
    704238805,
    4128970897,
    3144820574,
    2857402727,
    948965521,
    3333752299,
    2227686284,
    718756367,
    2269778983,
    2731643755,
    718440111,
    2857816721,
    3616097120,
    1113355533,
    2478022182,
    410092745,
    1811985197,
    1944238868,
    2696854588,
    1415722873,
    1682284203,
    1060277122,
    1998114690,
    1503841958,
    82706478,
    2315155686,
    1068173648,
    845149890,
    2167947013,
    1768146376,
    1993038550,
    3566826697,
    3390574031,
    940016341,
    3355073782,
    2328040721,
    904371731,
    1205506512,
    4094660742,
    2816623006,
    825647681,
    85914773,
    2857843460,
    1249926541,
    1417871568,
    3287612,
    3211054559,
    3126306446,
    1975924523,
    1353700161,
    2814456437,
    2438597621,
    1800716203,
    722146342,
    2873936343,
    1151126914,
    4160483941,
    2877670899,
    458611604,
    2866078500,
    3483680063,
    770352098,
    2652916994,
    3367839148,
    3940505011,
    3585973912,
    3809620402,
    718646636,
    2504206814,
    2914927912,
    3631288169,
    2857486607,
    2860018678,
    575749918,
    2857478043,
    718488780,
    2069512688,
    3548183469,
    453416197,
    1106044049,
    3032691430,
    52586708,
    3378514636,
    3459808877,
    3211506028,
    1785789304,
    218356169,
    3571399134,
    3759170522,
    1194783844,
    1523787992,
    3007827094,
    1975193539,
    2555452411,
    1341901877,
    3045838698,
    3776907964,
    3217423946,
    2802510864,
    2889438986,
    1057244207,
    1636348243,
    3761863214,
    1462225785,
    2632663439,
    481089165,
    718503062,
    24497053,
    3332243209,
    3344655856,
    3655024856,
    3960371065,
    1195698900,
    2971415156,
    3710176158,
    2115785917,
    4027663609,
    3525578417,
    2524296189,
    2745972565,
    3564906415,
    1372086093,
    1452307862,
    2780501478,
    1476592880,
    3389271281,
    18495466,
    2378148571,
    901398090,
    891748256,
    3279637769,
    3157290713,
    2560960102,
    1447622437,
    4284372637,
    216884176,
    2086908623,
    1879786977,
    3588903153,
    2242455666,
    2938092967,
    3559082096,
    2810645491,
    758861177,
    1121993112,
    215018983,
    642190776,
    4169236812,
    1196255959,
    2081185372,
    3508738393,
    941322904,
    4124243163,
    2877523539,
    1848581667,
    2205260958,
    3180453958,
    2589345134,
    3694731276,
    550028657,
    2519456284,
    3789985535,
    2973870856,
    2093648313,
    443148163,
    46942275,
    2734146937,
    1117713533,
    1115362972,
    1523183689,
    3717140224,
    1551984063
  ];
  sBox[1] = [
    522195092,
    4010518363,
    1776537470,
    960447360,
    4267822970,
    4005896314,
    1435016340,
    1929119313,
    2913464185,
    1310552629,
    3579470798,
    3724818106,
    2579771631,
    1594623892,
    417127293,
    2715217907,
    2696228731,
    1508390405,
    3994398868,
    3925858569,
    3695444102,
    4019471449,
    3129199795,
    3770928635,
    3520741761,
    990456497,
    4187484609,
    2783367035,
    21106139,
    3840405339,
    631373633,
    3783325702,
    532942976,
    396095098,
    3548038825,
    4267192484,
    2564721535,
    2011709262,
    2039648873,
    620404603,
    3776170075,
    2898526339,
    3612357925,
    4159332703,
    1645490516,
    223693667,
    1567101217,
    3362177881,
    1029951347,
    3470931136,
    3570957959,
    1550265121,
    119497089,
    972513919,
    907948164,
    3840628539,
    1613718692,
    3594177948,
    465323573,
    2659255085,
    654439692,
    2575596212,
    2699288441,
    3127702412,
    277098644,
    624404830,
    4100943870,
    2717858591,
    546110314,
    2403699828,
    3655377447,
    1321679412,
    4236791657,
    1045293279,
    4010672264,
    895050893,
    2319792268,
    494945126,
    1914543101,
    2777056443,
    3894764339,
    2219737618,
    311263384,
    4275257268,
    3458730721,
    669096869,
    3584475730,
    3835122877,
    3319158237,
    3949359204,
    2005142349,
    2713102337,
    2228954793,
    3769984788,
    569394103,
    3855636576,
    1425027204,
    108000370,
    2736431443,
    3671869269,
    3043122623,
    1750473702,
    2211081108,
    762237499,
    3972989403,
    2798899386,
    3061857628,
    2943854345,
    867476300,
    964413654,
    1591880597,
    1594774276,
    2179821409,
    552026980,
    3026064248,
    3726140315,
    2283577634,
    3110545105,
    2152310760,
    582474363,
    1582640421,
    1383256631,
    2043843868,
    3322775884,
    1217180674,
    463797851,
    2763038571,
    480777679,
    2718707717,
    2289164131,
    3118346187,
    214354409,
    200212307,
    3810608407,
    3025414197,
    2674075964,
    3997296425,
    1847405948,
    1342460550,
    510035443,
    4080271814,
    815934613,
    833030224,
    1620250387,
    1945732119,
    2703661145,
    3966000196,
    1388869545,
    3456054182,
    2687178561,
    2092620194,
    562037615,
    1356438536,
    3409922145,
    3261847397,
    1688467115,
    2150901366,
    631725691,
    3840332284,
    549916902,
    3455104640,
    394546491,
    837744717,
    2114462948,
    751520235,
    2221554606,
    2415360136,
    3999097078,
    2063029875,
    803036379,
    2702586305,
    821456707,
    3019566164,
    360699898,
    4018502092,
    3511869016,
    3677355358,
    2402471449,
    812317050,
    49299192,
    2570164949,
    3259169295,
    2816732080,
    3331213574,
    3101303564,
    2156015656,
    3705598920,
    3546263921,
    143268808,
    3200304480,
    1638124008,
    3165189453,
    3341807610,
    578956953,
    2193977524,
    3638120073,
    2333881532,
    807278310,
    658237817,
    2969561766,
    1641658566,
    11683945,
    3086995007,
    148645947,
    1138423386,
    4158756760,
    1981396783,
    2401016740,
    3699783584,
    380097457,
    2680394679,
    2803068651,
    3334260286,
    441530178,
    4016580796,
    1375954390,
    761952171,
    891809099,
    2183123478,
    157052462,
    3683840763,
    1592404427,
    341349109,
    2438483839,
    1417898363,
    644327628,
    2233032776,
    2353769706,
    2201510100,
    220455161,
    1815641738,
    182899273,
    2995019788,
    3627381533,
    3702638151,
    2890684138,
    1052606899,
    588164016,
    1681439879,
    4038439418,
    2405343923,
    4229449282,
    167996282,
    1336969661,
    1688053129,
    2739224926,
    1543734051,
    1046297529,
    1138201970,
    2121126012,
    115334942,
    1819067631,
    1902159161,
    1941945968,
    2206692869,
    1159982321
  ];
  sBox[2] = [
    2381300288,
    637164959,
    3952098751,
    3893414151,
    1197506559,
    916448331,
    2350892612,
    2932787856,
    3199334847,
    4009478890,
    3905886544,
    1373570990,
    2450425862,
    4037870920,
    3778841987,
    2456817877,
    286293407,
    124026297,
    3001279700,
    1028597854,
    3115296800,
    4208886496,
    2691114635,
    2188540206,
    1430237888,
    1218109995,
    3572471700,
    308166588,
    570424558,
    2187009021,
    2455094765,
    307733056,
    1310360322,
    3135275007,
    1384269543,
    2388071438,
    863238079,
    2359263624,
    2801553128,
    3380786597,
    2831162807,
    1470087780,
    1728663345,
    4072488799,
    1090516929,
    532123132,
    2389430977,
    1132193179,
    2578464191,
    3051079243,
    1670234342,
    1434557849,
    2711078940,
    1241591150,
    3314043432,
    3435360113,
    3091448339,
    1812415473,
    2198440252,
    267246943,
    796911696,
    3619716990,
    38830015,
    1526438404,
    2806502096,
    374413614,
    2943401790,
    1489179520,
    1603809326,
    1920779204,
    168801282,
    260042626,
    2358705581,
    1563175598,
    2397674057,
    1356499128,
    2217211040,
    514611088,
    2037363785,
    2186468373,
    4022173083,
    2792511869,
    2913485016,
    1173701892,
    4200428547,
    3896427269,
    1334932762,
    2455136706,
    602925377,
    2835607854,
    1613172210,
    41346230,
    2499634548,
    2457437618,
    2188827595,
    41386358,
    4172255629,
    1313404830,
    2405527007,
    3801973774,
    2217704835,
    873260488,
    2528884354,
    2478092616,
    4012915883,
    2555359016,
    2006953883,
    2463913485,
    575479328,
    2218240648,
    2099895446,
    660001756,
    2341502190,
    3038761536,
    3888151779,
    3848713377,
    3286851934,
    1022894237,
    1620365795,
    3449594689,
    1551255054,
    15374395,
    3570825345,
    4249311020,
    4151111129,
    3181912732,
    310226346,
    1133119310,
    530038928,
    136043402,
    2476768958,
    3107506709,
    2544909567,
    1036173560,
    2367337196,
    1681395281,
    1758231547,
    3641649032,
    306774401,
    1575354324,
    3716085866,
    1990386196,
    3114533736,
    2455606671,
    1262092282,
    3124342505,
    2768229131,
    4210529083,
    1833535011,
    423410938,
    660763973,
    2187129978,
    1639812e3,
    3508421329,
    3467445492,
    310289298,
    272797111,
    2188552562,
    2456863912,
    310240523,
    677093832,
    1013118031,
    901835429,
    3892695601,
    1116285435,
    3036471170,
    1337354835,
    243122523,
    520626091,
    277223598,
    4244441197,
    4194248841,
    1766575121,
    594173102,
    316590669,
    742362309,
    3536858622,
    4176435350,
    3838792410,
    2501204839,
    1229605004,
    3115755532,
    1552908988,
    2312334149,
    979407927,
    3959474601,
    1148277331,
    176638793,
    3614686272,
    2083809052,
    40992502,
    1340822838,
    2731552767,
    3535757508,
    3560899520,
    1354035053,
    122129617,
    7215240,
    2732932949,
    3118912700,
    2718203926,
    2539075635,
    3609230695,
    3725561661,
    1928887091,
    2882293555,
    1988674909,
    2063640240,
    2491088897,
    1459647954,
    4189817080,
    2302804382,
    1113892351,
    2237858528,
    1927010603,
    4002880361,
    1856122846,
    1594404395,
    2944033133,
    3855189863,
    3474975698,
    1643104450,
    4054590833,
    3431086530,
    1730235576,
    2984608721,
    3084664418,
    2131803598,
    4178205752,
    267404349,
    1617849798,
    1616132681,
    1462223176,
    736725533,
    2327058232,
    551665188,
    2945899023,
    1749386277,
    2575514597,
    1611482493,
    674206544,
    2201269090,
    3642560800,
    728599968,
    1680547377,
    2620414464,
    1388111496,
    453204106,
    4156223445,
    1094905244,
    2754698257,
    2201108165,
    3757000246,
    2704524545,
    3922940700,
    3996465027
  ];
  sBox[3] = [
    2645754912,
    532081118,
    2814278639,
    3530793624,
    1246723035,
    1689095255,
    2236679235,
    4194438865,
    2116582143,
    3859789411,
    157234593,
    2045505824,
    4245003587,
    1687664561,
    4083425123,
    605965023,
    672431967,
    1336064205,
    3376611392,
    214114848,
    4258466608,
    3232053071,
    489488601,
    605322005,
    3998028058,
    264917351,
    1912574028,
    756637694,
    436560991,
    202637054,
    135989450,
    85393697,
    2152923392,
    3896401662,
    2895836408,
    2145855233,
    3535335007,
    115294817,
    3147733898,
    1922296357,
    3464822751,
    4117858305,
    1037454084,
    2725193275,
    2127856640,
    1417604070,
    1148013728,
    1827919605,
    642362335,
    2929772533,
    909348033,
    1346338451,
    3547799649,
    297154785,
    1917849091,
    4161712827,
    2883604526,
    3968694238,
    1469521537,
    3780077382,
    3375584256,
    1763717519,
    136166297,
    4290970789,
    1295325189,
    2134727907,
    2798151366,
    1566297257,
    3672928234,
    2677174161,
    2672173615,
    965822077,
    2780786062,
    289653839,
    1133871874,
    3491843819,
    35685304,
    1068898316,
    418943774,
    672553190,
    642281022,
    2346158704,
    1954014401,
    3037126780,
    4079815205,
    2030668546,
    3840588673,
    672283427,
    1776201016,
    359975446,
    3750173538,
    555499703,
    2769985273,
    1324923,
    69110472,
    152125443,
    3176785106,
    3822147285,
    1340634837,
    798073664,
    1434183902,
    15393959,
    216384236,
    1303690150,
    3881221631,
    3711134124,
    3960975413,
    106373927,
    2578434224,
    1455997841,
    1801814300,
    1578393881,
    1854262133,
    3188178946,
    3258078583,
    2302670060,
    1539295533,
    3505142565,
    3078625975,
    2372746020,
    549938159,
    3278284284,
    2620926080,
    181285381,
    2865321098,
    3970029511,
    68876850,
    488006234,
    1728155692,
    2608167508,
    836007927,
    2435231793,
    919367643,
    3339422534,
    3655756360,
    1457871481,
    40520939,
    1380155135,
    797931188,
    234455205,
    2255801827,
    3990488299,
    397000196,
    739833055,
    3077865373,
    2871719860,
    4022553888,
    772369276,
    390177364,
    3853951029,
    557662966,
    740064294,
    1640166671,
    1699928825,
    3535942136,
    622006121,
    3625353122,
    68743880,
    1742502,
    219489963,
    1664179233,
    1577743084,
    1236991741,
    410585305,
    2366487942,
    823226535,
    1050371084,
    3426619607,
    3586839478,
    212779912,
    4147118561,
    1819446015,
    1911218849,
    530248558,
    3486241071,
    3252585495,
    2886188651,
    3410272728,
    2342195030,
    20547779,
    2982490058,
    3032363469,
    3631753222,
    312714466,
    1870521650,
    1493008054,
    3491686656,
    615382978,
    4103671749,
    2534517445,
    1932181,
    2196105170,
    278426614,
    6369430,
    3274544417,
    2913018367,
    697336853,
    2143000447,
    2946413531,
    701099306,
    1558357093,
    2805003052,
    3500818408,
    2321334417,
    3567135975,
    216290473,
    3591032198,
    23009561,
    1996984579,
    3735042806,
    2024298078,
    3739440863,
    569400510,
    2339758983,
    3016033873,
    3097871343,
    3639523026,
    3844324983,
    3256173865,
    795471839,
    2951117563,
    4101031090,
    4091603803,
    3603732598,
    971261452,
    534414648,
    428311343,
    3389027175,
    2844869880,
    694888862,
    1227866773,
    2456207019,
    3043454569,
    2614353370,
    3749578031,
    3676663836,
    459166190,
    4132644070,
    1794958188,
    51825668,
    2252611902,
    3084671440,
    2036672799,
    3436641603,
    1099053433,
    2469121526,
    3059204941,
    1323291266,
    2061838604,
    1018778475,
    2233344254,
    2553501054,
    334295216,
    3556750194,
    1065731521,
    183467730
  ];
  sBox[4] = [
    2127105028,
    745436345,
    2601412319,
    2788391185,
    3093987327,
    500390133,
    1155374404,
    389092991,
    150729210,
    3891597772,
    3523549952,
    1935325696,
    716645080,
    946045387,
    2901812282,
    1774124410,
    3869435775,
    4039581901,
    3293136918,
    3438657920,
    948246080,
    363898952,
    3867875531,
    1286266623,
    1598556673,
    68334250,
    630723836,
    1104211938,
    1312863373,
    613332731,
    2377784574,
    1101634306,
    441780740,
    3129959883,
    1917973735,
    2510624549,
    3238456535,
    2544211978,
    3308894634,
    1299840618,
    4076074851,
    1756332096,
    3977027158,
    297047435,
    3790297736,
    2265573040,
    3621810518,
    1311375015,
    1667687725,
    47300608,
    3299642885,
    2474112369,
    201668394,
    1468347890,
    576830978,
    3594690761,
    3742605952,
    1958042578,
    1747032512,
    3558991340,
    1408974056,
    3366841779,
    682131401,
    1033214337,
    1545599232,
    4265137049,
    206503691,
    103024618,
    2855227313,
    1337551222,
    2428998917,
    2963842932,
    4015366655,
    3852247746,
    2796956967,
    3865723491,
    3747938335,
    247794022,
    3755824572,
    702416469,
    2434691994,
    397379957,
    851939612,
    2314769512,
    218229120,
    1380406772,
    62274761,
    214451378,
    3170103466,
    2276210409,
    3845813286,
    28563499,
    446592073,
    1693330814,
    3453727194,
    29968656,
    3093872512,
    220656637,
    2470637031,
    77972100,
    1667708854,
    1358280214,
    4064765667,
    2395616961,
    325977563,
    4277240721,
    4220025399,
    3605526484,
    3355147721,
    811859167,
    3069544926,
    3962126810,
    652502677,
    3075892249,
    4132761541,
    3498924215,
    1217549313,
    3250244479,
    3858715919,
    3053989961,
    1538642152,
    2279026266,
    2875879137,
    574252750,
    3324769229,
    2651358713,
    1758150215,
    141295887,
    2719868960,
    3515574750,
    4093007735,
    4194485238,
    1082055363,
    3417560400,
    395511885,
    2966884026,
    179534037,
    3646028556,
    3738688086,
    1092926436,
    2496269142,
    257381841,
    3772900718,
    1636087230,
    1477059743,
    2499234752,
    3811018894,
    2675660129,
    3285975680,
    90732309,
    1684827095,
    1150307763,
    1723134115,
    3237045386,
    1769919919,
    1240018934,
    815675215,
    750138730,
    2239792499,
    1234303040,
    1995484674,
    138143821,
    675421338,
    1145607174,
    1936608440,
    3238603024,
    2345230278,
    2105974004,
    323969391,
    779555213,
    3004902369,
    2861610098,
    1017501463,
    2098600890,
    2628620304,
    2940611490,
    2682542546,
    1171473753,
    3656571411,
    3687208071,
    4091869518,
    393037935,
    159126506,
    1662887367,
    1147106178,
    391545844,
    3452332695,
    1891500680,
    3016609650,
    1851642611,
    546529401,
    1167818917,
    3194020571,
    2848076033,
    3953471836,
    575554290,
    475796850,
    4134673196,
    450035699,
    2351251534,
    844027695,
    1080539133,
    86184846,
    1554234488,
    3692025454,
    1972511363,
    2018339607,
    1491841390,
    1141460869,
    1061690759,
    4244549243,
    2008416118,
    2351104703,
    2868147542,
    1598468138,
    722020353,
    1027143159,
    212344630,
    1387219594,
    1725294528,
    3745187956,
    2500153616,
    458938280,
    4129215917,
    1828119673,
    544571780,
    3503225445,
    2297937496,
    1241802790,
    267843827,
    2694610800,
    1397140384,
    1558801448,
    3782667683,
    1806446719,
    929573330,
    2234912681,
    400817706,
    616011623,
    4121520928,
    3603768725,
    1761550015,
    1968522284,
    4053731006,
    4192232858,
    4005120285,
    872482584,
    3140537016,
    3894607381,
    2287405443,
    1963876937,
    3663887957,
    1584857e3,
    2975024454,
    1833426440,
    4025083860
  ];
  sBox[5] = [
    4143615901,
    749497569,
    1285769319,
    3795025788,
    2514159847,
    23610292,
    3974978748,
    844452780,
    3214870880,
    3751928557,
    2213566365,
    1676510905,
    448177848,
    3730751033,
    4086298418,
    2307502392,
    871450977,
    3222878141,
    4110862042,
    3831651966,
    2735270553,
    1310974780,
    2043402188,
    1218528103,
    2736035353,
    4274605013,
    2702448458,
    3936360550,
    2693061421,
    162023535,
    2827510090,
    687910808,
    23484817,
    3784910947,
    3371371616,
    779677500,
    3503626546,
    3473927188,
    4157212626,
    3500679282,
    4248902014,
    2466621104,
    3899384794,
    1958663117,
    925738300,
    1283408968,
    3669349440,
    1840910019,
    137959847,
    2679828185,
    1239142320,
    1315376211,
    1547541505,
    1690155329,
    739140458,
    3128809933,
    3933172616,
    3876308834,
    905091803,
    1548541325,
    4040461708,
    3095483362,
    144808038,
    451078856,
    676114313,
    2861728291,
    2469707347,
    993665471,
    373509091,
    2599041286,
    4025009006,
    4170239449,
    2149739950,
    3275793571,
    3749616649,
    2794760199,
    1534877388,
    572371878,
    2590613551,
    1753320020,
    3467782511,
    1405125690,
    4270405205,
    633333386,
    3026356924,
    3475123903,
    632057672,
    2846462855,
    1404951397,
    3882875879,
    3915906424,
    195638627,
    2385783745,
    3902872553,
    1233155085,
    3355999740,
    2380578713,
    2702246304,
    2144565621,
    3663341248,
    3894384975,
    2502479241,
    4248018925,
    3094885567,
    1594115437,
    572884632,
    3385116731,
    767645374,
    1331858858,
    1475698373,
    3793881790,
    3532746431,
    1321687957,
    619889600,
    1121017241,
    3440213920,
    2070816767,
    2833025776,
    1933951238,
    4095615791,
    890643334,
    3874130214,
    859025556,
    360630002,
    925594799,
    1764062180,
    3920222280,
    4078305929,
    979562269,
    2810700344,
    4087740022,
    1949714515,
    546639971,
    1165388173,
    3069891591,
    1495988560,
    922170659,
    1291546247,
    2107952832,
    1813327274,
    3406010024,
    3306028637,
    4241950635,
    153207855,
    2313154747,
    1608695416,
    1150242611,
    1967526857,
    721801357,
    1220138373,
    3691287617,
    3356069787,
    2112743302,
    3281662835,
    1111556101,
    1778980689,
    250857638,
    2298507990,
    673216130,
    2846488510,
    3207751581,
    3562756981,
    3008625920,
    3417367384,
    2198807050,
    529510932,
    3547516680,
    3426503187,
    2364944742,
    102533054,
    2294910856,
    1617093527,
    1204784762,
    3066581635,
    1019391227,
    1069574518,
    1317995090,
    1691889997,
    3661132003,
    510022745,
    3238594800,
    1362108837,
    1817929911,
    2184153760,
    805817662,
    1953603311,
    3699844737,
    120799444,
    2118332377,
    207536705,
    2282301548,
    4120041617,
    145305846,
    2508124933,
    3086745533,
    3261524335,
    1877257368,
    2977164480,
    3160454186,
    2503252186,
    4221677074,
    759945014,
    254147243,
    2767453419,
    3801518371,
    629083197,
    2471014217,
    907280572,
    3900796746,
    940896768,
    2751021123,
    2625262786,
    3161476951,
    3661752313,
    3260732218,
    1425318020,
    2977912069,
    1496677566,
    3988592072,
    2140652971,
    3126511541,
    3069632175,
    977771578,
    1392695845,
    1698528874,
    1411812681,
    1369733098,
    1343739227,
    3620887944,
    1142123638,
    67414216,
    3102056737,
    3088749194,
    1626167401,
    2546293654,
    3941374235,
    697522451,
    33404913,
    143560186,
    2595682037,
    994885535,
    1247667115,
    3859094837,
    2699155541,
    3547024625,
    4114935275,
    2968073508,
    3199963069,
    2732024527,
    1237921620,
    951448369,
    1898488916,
    1211705605,
    2790989240,
    2233243581,
    3598044975
  ];
  sBox[6] = [
    2246066201,
    858518887,
    1714274303,
    3485882003,
    713916271,
    2879113490,
    3730835617,
    539548191,
    36158695,
    1298409750,
    419087104,
    1358007170,
    749914897,
    2989680476,
    1261868530,
    2995193822,
    2690628854,
    3443622377,
    3780124940,
    3796824509,
    2976433025,
    4259637129,
    1551479e3,
    512490819,
    1296650241,
    951993153,
    2436689437,
    2460458047,
    144139966,
    3136204276,
    310820559,
    3068840729,
    643875328,
    1969602020,
    1680088954,
    2185813161,
    3283332454,
    672358534,
    198762408,
    896343282,
    276269502,
    3014846926,
    84060815,
    197145886,
    376173866,
    3943890818,
    3813173521,
    3545068822,
    1316698879,
    1598252827,
    2633424951,
    1233235075,
    859989710,
    2358460855,
    3503838400,
    3409603720,
    1203513385,
    1193654839,
    2792018475,
    2060853022,
    207403770,
    1144516871,
    3068631394,
    1121114134,
    177607304,
    3785736302,
    326409831,
    1929119770,
    2983279095,
    4183308101,
    3474579288,
    3200513878,
    3228482096,
    119610148,
    1170376745,
    3378393471,
    3163473169,
    951863017,
    3337026068,
    3135789130,
    2907618374,
    1183797387,
    2015970143,
    4045674555,
    2182986399,
    2952138740,
    3928772205,
    384012900,
    2454997643,
    10178499,
    2879818989,
    2596892536,
    111523738,
    2995089006,
    451689641,
    3196290696,
    235406569,
    1441906262,
    3890558523,
    3013735005,
    4158569349,
    1644036924,
    376726067,
    1006849064,
    3664579700,
    2041234796,
    1021632941,
    1374734338,
    2566452058,
    371631263,
    4007144233,
    490221539,
    206551450,
    3140638584,
    1053219195,
    1853335209,
    3412429660,
    3562156231,
    735133835,
    1623211703,
    3104214392,
    2738312436,
    4096837757,
    3366392578,
    3110964274,
    3956598718,
    3196820781,
    2038037254,
    3877786376,
    2339753847,
    300912036,
    3766732888,
    2372630639,
    1516443558,
    4200396704,
    1574567987,
    4069441456,
    4122592016,
    2699739776,
    146372218,
    2748961456,
    2043888151,
    35287437,
    2596680554,
    655490400,
    1132482787,
    110692520,
    1031794116,
    2188192751,
    1324057718,
    1217253157,
    919197030,
    686247489,
    3261139658,
    1028237775,
    3135486431,
    3059715558,
    2460921700,
    986174950,
    2661811465,
    4062904701,
    2752986992,
    3709736643,
    367056889,
    1353824391,
    731860949,
    1650113154,
    1778481506,
    784341916,
    357075625,
    3608602432,
    1074092588,
    2480052770,
    3811426202,
    92751289,
    877911070,
    3600361838,
    1231880047,
    480201094,
    3756190983,
    3094495953,
    434011822,
    87971354,
    363687820,
    1717726236,
    1901380172,
    3926403882,
    2481662265,
    400339184,
    1490350766,
    2661455099,
    1389319756,
    2558787174,
    784598401,
    1983468483,
    30828846,
    3550527752,
    2716276238,
    3841122214,
    1765724805,
    1955612312,
    1277890269,
    1333098070,
    1564029816,
    2704417615,
    1026694237,
    3287671188,
    1260819201,
    3349086767,
    1016692350,
    1582273796,
    1073413053,
    1995943182,
    694588404,
    1025494639,
    3323872702,
    3551898420,
    4146854327,
    453260480,
    1316140391,
    1435673405,
    3038941953,
    3486689407,
    1622062951,
    403978347,
    817677117,
    950059133,
    4246079218,
    3278066075,
    1486738320,
    1417279718,
    481875527,
    2549965225,
    3933690356,
    760697757,
    1452955855,
    3897451437,
    1177426808,
    1702951038,
    4085348628,
    2447005172,
    1084371187,
    3516436277,
    3068336338,
    1073369276,
    1027665953,
    3284188590,
    1230553676,
    1368340146,
    2226246512,
    267243139,
    2274220762,
    4070734279,
    2497715176,
    2423353163,
    2504755875
  ];
  sBox[7] = [
    3793104909,
    3151888380,
    2817252029,
    895778965,
    2005530807,
    3871412763,
    237245952,
    86829237,
    296341424,
    3851759377,
    3974600970,
    2475086196,
    709006108,
    1994621201,
    2972577594,
    937287164,
    3734691505,
    168608556,
    3189338153,
    2225080640,
    3139713551,
    3033610191,
    3025041904,
    77524477,
    185966941,
    1208824168,
    2344345178,
    1721625922,
    3354191921,
    1066374631,
    1927223579,
    1971335949,
    2483503697,
    1551748602,
    2881383779,
    2856329572,
    3003241482,
    48746954,
    1398218158,
    2050065058,
    313056748,
    4255789917,
    393167848,
    1912293076,
    940740642,
    3465845460,
    3091687853,
    2522601570,
    2197016661,
    1727764327,
    364383054,
    492521376,
    1291706479,
    3264136376,
    1474851438,
    1685747964,
    2575719748,
    1619776915,
    1814040067,
    970743798,
    1561002147,
    2925768690,
    2123093554,
    1880132620,
    3151188041,
    697884420,
    2550985770,
    2607674513,
    2659114323,
    110200136,
    1489731079,
    997519150,
    1378877361,
    3527870668,
    478029773,
    2766872923,
    1022481122,
    431258168,
    1112503832,
    897933369,
    2635587303,
    669726182,
    3383752315,
    918222264,
    163866573,
    3246985393,
    3776823163,
    114105080,
    1903216136,
    761148244,
    3571337562,
    1690750982,
    3166750252,
    1037045171,
    1888456500,
    2010454850,
    642736655,
    616092351,
    365016990,
    1185228132,
    4174898510,
    1043824992,
    2023083429,
    2241598885,
    3863320456,
    3279669087,
    3674716684,
    108438443,
    2132974366,
    830746235,
    606445527,
    4173263986,
    2204105912,
    1844756978,
    2532684181,
    4245352700,
    2969441100,
    3796921661,
    1335562986,
    4061524517,
    2720232303,
    2679424040,
    634407289,
    885462008,
    3294724487,
    3933892248,
    2094100220,
    339117932,
    4048830727,
    3202280980,
    1458155303,
    2689246273,
    1022871705,
    2464987878,
    3714515309,
    353796843,
    2822958815,
    4256850100,
    4052777845,
    551748367,
    618185374,
    3778635579,
    4020649912,
    1904685140,
    3069366075,
    2670879810,
    3407193292,
    2954511620,
    4058283405,
    2219449317,
    3135758300,
    1120655984,
    3447565834,
    1474845562,
    3577699062,
    550456716,
    3466908712,
    2043752612,
    881257467,
    869518812,
    2005220179,
    938474677,
    3305539448,
    3850417126,
    1315485940,
    3318264702,
    226533026,
    965733244,
    321539988,
    1136104718,
    804158748,
    573969341,
    3708209826,
    937399083,
    3290727049,
    2901666755,
    1461057207,
    4013193437,
    4066861423,
    3242773476,
    2421326174,
    1581322155,
    3028952165,
    786071460,
    3900391652,
    3918438532,
    1485433313,
    4023619836,
    3708277595,
    3678951060,
    953673138,
    1467089153,
    1930354364,
    1533292819,
    2492563023,
    1346121658,
    1685000834,
    1965281866,
    3765933717,
    4190206607,
    2052792609,
    3515332758,
    690371149,
    3125873887,
    2180283551,
    2903598061,
    3933952357,
    436236910,
    289419410,
    14314871,
    1242357089,
    2904507907,
    1616633776,
    2666382180,
    585885352,
    3471299210,
    2699507360,
    1432659641,
    277164553,
    3354103607,
    770115018,
    2303809295,
    3741942315,
    3177781868,
    2853364978,
    2269453327,
    3774259834,
    987383833,
    1290892879,
    225909803,
    1741533526,
    890078084,
    1496906255,
    1111072499,
    916028167,
    243534141,
    1252605537,
    2204162171,
    531204876,
    290011180,
    3916834213,
    102027703,
    237315147,
    209093447,
    1486785922,
    220223953,
    2758195998,
    4175039106,
    82940208,
    3127791296,
    2569425252,
    518464269,
    1353887104,
    3941492737,
    2377294467,
    3935040926
  ];
}
function CAST5(key) {
  this.cast5 = new OpenPGPSymEncCAST5();
  this.cast5.setKey(key);
  this.encrypt = function(block) {
    return this.cast5.encrypt(block);
  };
}
CAST5.blockSize = CAST5.prototype.blockSize = 8;
CAST5.keySize = CAST5.prototype.keySize = 16;
var MAXINT = 4294967295;
function rotw(w, n) {
  return (w << n | w >>> 32 - n) & MAXINT;
}
function getW(a, i) {
  return a[i] | a[i + 1] << 8 | a[i + 2] << 16 | a[i + 3] << 24;
}
function setW(a, i, w) {
  a.splice(i, 4, w & 255, w >>> 8 & 255, w >>> 16 & 255, w >>> 24 & 255);
}
function getB(x, n) {
  return x >>> n * 8 & 255;
}
function createTwofish() {
  let keyBytes = null;
  let dataBytes = null;
  let dataOffset = -1;
  let tfsKey = [];
  let tfsM = [
    [],
    [],
    [],
    []
  ];
  function tfsInit(key) {
    keyBytes = key;
    let i;
    let a;
    let b;
    let c;
    let d;
    const meKey = [];
    const moKey = [];
    const inKey = [];
    let kLen;
    const sKey = [];
    let f01;
    let f5b;
    let fef;
    const q0 = [
      [8, 1, 7, 13, 6, 15, 3, 2, 0, 11, 5, 9, 14, 12, 10, 4],
      [2, 8, 11, 13, 15, 7, 6, 14, 3, 1, 9, 4, 0, 10, 12, 5]
    ];
    const q1 = [
      [14, 12, 11, 8, 1, 2, 3, 5, 15, 4, 10, 6, 7, 0, 9, 13],
      [1, 14, 2, 11, 4, 12, 3, 7, 6, 13, 10, 5, 15, 9, 0, 8]
    ];
    const q2 = [
      [11, 10, 5, 14, 6, 13, 9, 0, 12, 8, 15, 3, 2, 4, 7, 1],
      [4, 12, 7, 5, 1, 6, 9, 10, 0, 14, 13, 8, 2, 11, 3, 15]
    ];
    const q3 = [
      [13, 7, 15, 4, 1, 2, 6, 14, 9, 11, 3, 0, 8, 5, 12, 10],
      [11, 9, 5, 1, 12, 3, 13, 14, 6, 4, 7, 15, 2, 0, 8, 10]
    ];
    const ror4 = [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
    const ashx = [0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 5, 14, 7];
    const q = [
      [],
      []
    ];
    const m = [
      [],
      [],
      [],
      []
    ];
    function ffm5b(x) {
      return x ^ x >> 2 ^ [0, 90, 180, 238][x & 3];
    }
    function ffmEf(x) {
      return x ^ x >> 1 ^ x >> 2 ^ [0, 238, 180, 90][x & 3];
    }
    function mdsRem(p, q4) {
      let i2;
      let t;
      let u;
      for (i2 = 0; i2 < 8; i2++) {
        t = q4 >>> 24;
        q4 = q4 << 8 & MAXINT | p >>> 24;
        p = p << 8 & MAXINT;
        u = t << 1;
        if (t & 128) {
          u ^= 333;
        }
        q4 ^= t ^ u << 16;
        u ^= t >>> 1;
        if (t & 1) {
          u ^= 166;
        }
        q4 ^= u << 24 | u << 8;
      }
      return q4;
    }
    function qp(n, x) {
      const a2 = x >> 4;
      const b2 = x & 15;
      const c2 = q0[n][a2 ^ b2];
      const d2 = q1[n][ror4[b2] ^ ashx[a2]];
      return q3[n][ror4[d2] ^ ashx[c2]] << 4 | q2[n][c2 ^ d2];
    }
    function hFun(x, key2) {
      let a2 = getB(x, 0);
      let b2 = getB(x, 1);
      let c2 = getB(x, 2);
      let d2 = getB(x, 3);
      switch (kLen) {
        case 4:
          a2 = q[1][a2] ^ getB(key2[3], 0);
          b2 = q[0][b2] ^ getB(key2[3], 1);
          c2 = q[0][c2] ^ getB(key2[3], 2);
          d2 = q[1][d2] ^ getB(key2[3], 3);
        case 3:
          a2 = q[1][a2] ^ getB(key2[2], 0);
          b2 = q[1][b2] ^ getB(key2[2], 1);
          c2 = q[0][c2] ^ getB(key2[2], 2);
          d2 = q[0][d2] ^ getB(key2[2], 3);
        case 2:
          a2 = q[0][q[0][a2] ^ getB(key2[1], 0)] ^ getB(key2[0], 0);
          b2 = q[0][q[1][b2] ^ getB(key2[1], 1)] ^ getB(key2[0], 1);
          c2 = q[1][q[0][c2] ^ getB(key2[1], 2)] ^ getB(key2[0], 2);
          d2 = q[1][q[1][d2] ^ getB(key2[1], 3)] ^ getB(key2[0], 3);
      }
      return m[0][a2] ^ m[1][b2] ^ m[2][c2] ^ m[3][d2];
    }
    keyBytes = keyBytes.slice(0, 32);
    i = keyBytes.length;
    while (i !== 16 && i !== 24 && i !== 32) {
      keyBytes[i++] = 0;
    }
    for (i = 0; i < keyBytes.length; i += 4) {
      inKey[i >> 2] = getW(keyBytes, i);
    }
    for (i = 0; i < 256; i++) {
      q[0][i] = qp(0, i);
      q[1][i] = qp(1, i);
    }
    for (i = 0; i < 256; i++) {
      f01 = q[1][i];
      f5b = ffm5b(f01);
      fef = ffmEf(f01);
      m[0][i] = f01 + (f5b << 8) + (fef << 16) + (fef << 24);
      m[2][i] = f5b + (fef << 8) + (f01 << 16) + (fef << 24);
      f01 = q[0][i];
      f5b = ffm5b(f01);
      fef = ffmEf(f01);
      m[1][i] = fef + (fef << 8) + (f5b << 16) + (f01 << 24);
      m[3][i] = f5b + (f01 << 8) + (fef << 16) + (f5b << 24);
    }
    kLen = inKey.length / 2;
    for (i = 0; i < kLen; i++) {
      a = inKey[i + i];
      meKey[i] = a;
      b = inKey[i + i + 1];
      moKey[i] = b;
      sKey[kLen - i - 1] = mdsRem(a, b);
    }
    for (i = 0; i < 40; i += 2) {
      a = 16843009 * i;
      b = a + 16843009;
      a = hFun(a, meKey);
      b = rotw(hFun(b, moKey), 8);
      tfsKey[i] = a + b & MAXINT;
      tfsKey[i + 1] = rotw(a + 2 * b, 9);
    }
    for (i = 0; i < 256; i++) {
      a = b = c = d = i;
      switch (kLen) {
        case 4:
          a = q[1][a] ^ getB(sKey[3], 0);
          b = q[0][b] ^ getB(sKey[3], 1);
          c = q[0][c] ^ getB(sKey[3], 2);
          d = q[1][d] ^ getB(sKey[3], 3);
        case 3:
          a = q[1][a] ^ getB(sKey[2], 0);
          b = q[1][b] ^ getB(sKey[2], 1);
          c = q[0][c] ^ getB(sKey[2], 2);
          d = q[0][d] ^ getB(sKey[2], 3);
        case 2:
          tfsM[0][i] = m[0][q[0][q[0][a] ^ getB(sKey[1], 0)] ^ getB(sKey[0], 0)];
          tfsM[1][i] = m[1][q[0][q[1][b] ^ getB(sKey[1], 1)] ^ getB(sKey[0], 1)];
          tfsM[2][i] = m[2][q[1][q[0][c] ^ getB(sKey[1], 2)] ^ getB(sKey[0], 2)];
          tfsM[3][i] = m[3][q[1][q[1][d] ^ getB(sKey[1], 3)] ^ getB(sKey[0], 3)];
      }
    }
  }
  function tfsG0(x) {
    return tfsM[0][getB(x, 0)] ^ tfsM[1][getB(x, 1)] ^ tfsM[2][getB(x, 2)] ^ tfsM[3][getB(x, 3)];
  }
  function tfsG1(x) {
    return tfsM[0][getB(x, 3)] ^ tfsM[1][getB(x, 0)] ^ tfsM[2][getB(x, 1)] ^ tfsM[3][getB(x, 2)];
  }
  function tfsFrnd(r, blk) {
    let a = tfsG0(blk[0]);
    let b = tfsG1(blk[1]);
    blk[2] = rotw(blk[2] ^ a + b + tfsKey[4 * r + 8] & MAXINT, 31);
    blk[3] = rotw(blk[3], 1) ^ a + 2 * b + tfsKey[4 * r + 9] & MAXINT;
    a = tfsG0(blk[2]);
    b = tfsG1(blk[3]);
    blk[0] = rotw(blk[0] ^ a + b + tfsKey[4 * r + 10] & MAXINT, 31);
    blk[1] = rotw(blk[1], 1) ^ a + 2 * b + tfsKey[4 * r + 11] & MAXINT;
  }
  function tfsIrnd(i, blk) {
    let a = tfsG0(blk[0]);
    let b = tfsG1(blk[1]);
    blk[2] = rotw(blk[2], 1) ^ a + b + tfsKey[4 * i + 10] & MAXINT;
    blk[3] = rotw(blk[3] ^ a + 2 * b + tfsKey[4 * i + 11] & MAXINT, 31);
    a = tfsG0(blk[2]);
    b = tfsG1(blk[3]);
    blk[0] = rotw(blk[0], 1) ^ a + b + tfsKey[4 * i + 8] & MAXINT;
    blk[1] = rotw(blk[1] ^ a + 2 * b + tfsKey[4 * i + 9] & MAXINT, 31);
  }
  function tfsClose() {
    tfsKey = [];
    tfsM = [
      [],
      [],
      [],
      []
    ];
  }
  function tfsEncrypt(data, offset) {
    dataBytes = data;
    dataOffset = offset;
    const blk = [
      getW(dataBytes, dataOffset) ^ tfsKey[0],
      getW(dataBytes, dataOffset + 4) ^ tfsKey[1],
      getW(dataBytes, dataOffset + 8) ^ tfsKey[2],
      getW(dataBytes, dataOffset + 12) ^ tfsKey[3]
    ];
    for (let j = 0; j < 8; j++) {
      tfsFrnd(j, blk);
    }
    setW(dataBytes, dataOffset, blk[2] ^ tfsKey[4]);
    setW(dataBytes, dataOffset + 4, blk[3] ^ tfsKey[5]);
    setW(dataBytes, dataOffset + 8, blk[0] ^ tfsKey[6]);
    setW(dataBytes, dataOffset + 12, blk[1] ^ tfsKey[7]);
    dataOffset += 16;
    return dataBytes;
  }
  function tfsDecrypt(data, offset) {
    dataBytes = data;
    dataOffset = offset;
    const blk = [
      getW(dataBytes, dataOffset) ^ tfsKey[4],
      getW(dataBytes, dataOffset + 4) ^ tfsKey[5],
      getW(dataBytes, dataOffset + 8) ^ tfsKey[6],
      getW(dataBytes, dataOffset + 12) ^ tfsKey[7]
    ];
    for (let j = 7; j >= 0; j--) {
      tfsIrnd(j, blk);
    }
    setW(dataBytes, dataOffset, blk[2] ^ tfsKey[0]);
    setW(dataBytes, dataOffset + 4, blk[3] ^ tfsKey[1]);
    setW(dataBytes, dataOffset + 8, blk[0] ^ tfsKey[2]);
    setW(dataBytes, dataOffset + 12, blk[1] ^ tfsKey[3]);
    dataOffset += 16;
  }
  function tfsFinal() {
    return dataBytes;
  }
  return {
    name: "twofish",
    blocksize: 128 / 8,
    open: tfsInit,
    close: tfsClose,
    encrypt: tfsEncrypt,
    decrypt: tfsDecrypt,
    // added by Recurity Labs
    finalize: tfsFinal
  };
}
function TF(key) {
  this.tf = createTwofish();
  this.tf.open(Array.from(key), 0);
  this.encrypt = function(block) {
    return this.tf.encrypt(Array.from(block), 0);
  };
}
TF.keySize = TF.prototype.keySize = 32;
TF.blockSize = TF.prototype.blockSize = 16;
function Blowfish() {
}
Blowfish.prototype.BLOCKSIZE = 8;
Blowfish.prototype.SBOXES = [
  [
    3509652390,
    2564797868,
    805139163,
    3491422135,
    3101798381,
    1780907670,
    3128725573,
    4046225305,
    614570311,
    3012652279,
    134345442,
    2240740374,
    1667834072,
    1901547113,
    2757295779,
    4103290238,
    227898511,
    1921955416,
    1904987480,
    2182433518,
    2069144605,
    3260701109,
    2620446009,
    720527379,
    3318853667,
    677414384,
    3393288472,
    3101374703,
    2390351024,
    1614419982,
    1822297739,
    2954791486,
    3608508353,
    3174124327,
    2024746970,
    1432378464,
    3864339955,
    2857741204,
    1464375394,
    1676153920,
    1439316330,
    715854006,
    3033291828,
    289532110,
    2706671279,
    2087905683,
    3018724369,
    1668267050,
    732546397,
    1947742710,
    3462151702,
    2609353502,
    2950085171,
    1814351708,
    2050118529,
    680887927,
    999245976,
    1800124847,
    3300911131,
    1713906067,
    1641548236,
    4213287313,
    1216130144,
    1575780402,
    4018429277,
    3917837745,
    3693486850,
    3949271944,
    596196993,
    3549867205,
    258830323,
    2213823033,
    772490370,
    2760122372,
    1774776394,
    2652871518,
    566650946,
    4142492826,
    1728879713,
    2882767088,
    1783734482,
    3629395816,
    2517608232,
    2874225571,
    1861159788,
    326777828,
    3124490320,
    2130389656,
    2716951837,
    967770486,
    1724537150,
    2185432712,
    2364442137,
    1164943284,
    2105845187,
    998989502,
    3765401048,
    2244026483,
    1075463327,
    1455516326,
    1322494562,
    910128902,
    469688178,
    1117454909,
    936433444,
    3490320968,
    3675253459,
    1240580251,
    122909385,
    2157517691,
    634681816,
    4142456567,
    3825094682,
    3061402683,
    2540495037,
    79693498,
    3249098678,
    1084186820,
    1583128258,
    426386531,
    1761308591,
    1047286709,
    322548459,
    995290223,
    1845252383,
    2603652396,
    3431023940,
    2942221577,
    3202600964,
    3727903485,
    1712269319,
    422464435,
    3234572375,
    1170764815,
    3523960633,
    3117677531,
    1434042557,
    442511882,
    3600875718,
    1076654713,
    1738483198,
    4213154764,
    2393238008,
    3677496056,
    1014306527,
    4251020053,
    793779912,
    2902807211,
    842905082,
    4246964064,
    1395751752,
    1040244610,
    2656851899,
    3396308128,
    445077038,
    3742853595,
    3577915638,
    679411651,
    2892444358,
    2354009459,
    1767581616,
    3150600392,
    3791627101,
    3102740896,
    284835224,
    4246832056,
    1258075500,
    768725851,
    2589189241,
    3069724005,
    3532540348,
    1274779536,
    3789419226,
    2764799539,
    1660621633,
    3471099624,
    4011903706,
    913787905,
    3497959166,
    737222580,
    2514213453,
    2928710040,
    3937242737,
    1804850592,
    3499020752,
    2949064160,
    2386320175,
    2390070455,
    2415321851,
    4061277028,
    2290661394,
    2416832540,
    1336762016,
    1754252060,
    3520065937,
    3014181293,
    791618072,
    3188594551,
    3933548030,
    2332172193,
    3852520463,
    3043980520,
    413987798,
    3465142937,
    3030929376,
    4245938359,
    2093235073,
    3534596313,
    375366246,
    2157278981,
    2479649556,
    555357303,
    3870105701,
    2008414854,
    3344188149,
    4221384143,
    3956125452,
    2067696032,
    3594591187,
    2921233993,
    2428461,
    544322398,
    577241275,
    1471733935,
    610547355,
    4027169054,
    1432588573,
    1507829418,
    2025931657,
    3646575487,
    545086370,
    48609733,
    2200306550,
    1653985193,
    298326376,
    1316178497,
    3007786442,
    2064951626,
    458293330,
    2589141269,
    3591329599,
    3164325604,
    727753846,
    2179363840,
    146436021,
    1461446943,
    4069977195,
    705550613,
    3059967265,
    3887724982,
    4281599278,
    3313849956,
    1404054877,
    2845806497,
    146425753,
    1854211946
  ],
  [
    1266315497,
    3048417604,
    3681880366,
    3289982499,
    290971e4,
    1235738493,
    2632868024,
    2414719590,
    3970600049,
    1771706367,
    1449415276,
    3266420449,
    422970021,
    1963543593,
    2690192192,
    3826793022,
    1062508698,
    1531092325,
    1804592342,
    2583117782,
    2714934279,
    4024971509,
    1294809318,
    4028980673,
    1289560198,
    2221992742,
    1669523910,
    35572830,
    157838143,
    1052438473,
    1016535060,
    1802137761,
    1753167236,
    1386275462,
    3080475397,
    2857371447,
    1040679964,
    2145300060,
    2390574316,
    1461121720,
    2956646967,
    4031777805,
    4028374788,
    33600511,
    2920084762,
    1018524850,
    629373528,
    3691585981,
    3515945977,
    2091462646,
    2486323059,
    586499841,
    988145025,
    935516892,
    3367335476,
    2599673255,
    2839830854,
    265290510,
    3972581182,
    2759138881,
    3795373465,
    1005194799,
    847297441,
    406762289,
    1314163512,
    1332590856,
    1866599683,
    4127851711,
    750260880,
    613907577,
    1450815602,
    3165620655,
    3734664991,
    3650291728,
    3012275730,
    3704569646,
    1427272223,
    778793252,
    1343938022,
    2676280711,
    2052605720,
    1946737175,
    3164576444,
    3914038668,
    3967478842,
    3682934266,
    1661551462,
    3294938066,
    4011595847,
    840292616,
    3712170807,
    616741398,
    312560963,
    711312465,
    1351876610,
    322626781,
    1910503582,
    271666773,
    2175563734,
    1594956187,
    70604529,
    3617834859,
    1007753275,
    1495573769,
    4069517037,
    2549218298,
    2663038764,
    504708206,
    2263041392,
    3941167025,
    2249088522,
    1514023603,
    1998579484,
    1312622330,
    694541497,
    2582060303,
    2151582166,
    1382467621,
    776784248,
    2618340202,
    3323268794,
    2497899128,
    2784771155,
    503983604,
    4076293799,
    907881277,
    423175695,
    432175456,
    1378068232,
    4145222326,
    3954048622,
    3938656102,
    3820766613,
    2793130115,
    2977904593,
    26017576,
    3274890735,
    3194772133,
    1700274565,
    1756076034,
    4006520079,
    3677328699,
    720338349,
    1533947780,
    354530856,
    688349552,
    3973924725,
    1637815568,
    332179504,
    3949051286,
    53804574,
    2852348879,
    3044236432,
    1282449977,
    3583942155,
    3416972820,
    4006381244,
    1617046695,
    2628476075,
    3002303598,
    1686838959,
    431878346,
    2686675385,
    1700445008,
    1080580658,
    1009431731,
    832498133,
    3223435511,
    2605976345,
    2271191193,
    2516031870,
    1648197032,
    4164389018,
    2548247927,
    300782431,
    375919233,
    238389289,
    3353747414,
    2531188641,
    2019080857,
    1475708069,
    455242339,
    2609103871,
    448939670,
    3451063019,
    1395535956,
    2413381860,
    1841049896,
    1491858159,
    885456874,
    4264095073,
    4001119347,
    1565136089,
    3898914787,
    1108368660,
    540939232,
    1173283510,
    2745871338,
    3681308437,
    4207628240,
    3343053890,
    4016749493,
    1699691293,
    1103962373,
    3625875870,
    2256883143,
    3830138730,
    1031889488,
    3479347698,
    1535977030,
    4236805024,
    3251091107,
    2132092099,
    1774941330,
    1199868427,
    1452454533,
    157007616,
    2904115357,
    342012276,
    595725824,
    1480756522,
    206960106,
    497939518,
    591360097,
    863170706,
    2375253569,
    3596610801,
    1814182875,
    2094937945,
    3421402208,
    1082520231,
    3463918190,
    2785509508,
    435703966,
    3908032597,
    1641649973,
    2842273706,
    3305899714,
    1510255612,
    2148256476,
    2655287854,
    3276092548,
    4258621189,
    236887753,
    3681803219,
    274041037,
    1734335097,
    3815195456,
    3317970021,
    1899903192,
    1026095262,
    4050517792,
    356393447,
    2410691914,
    3873677099,
    3682840055
  ],
  [
    3913112168,
    2491498743,
    4132185628,
    2489919796,
    1091903735,
    1979897079,
    3170134830,
    3567386728,
    3557303409,
    857797738,
    1136121015,
    1342202287,
    507115054,
    2535736646,
    337727348,
    3213592640,
    1301675037,
    2528481711,
    1895095763,
    1721773893,
    3216771564,
    62756741,
    2142006736,
    835421444,
    2531993523,
    1442658625,
    3659876326,
    2882144922,
    676362277,
    1392781812,
    170690266,
    3921047035,
    1759253602,
    3611846912,
    1745797284,
    664899054,
    1329594018,
    3901205900,
    3045908486,
    2062866102,
    2865634940,
    3543621612,
    3464012697,
    1080764994,
    553557557,
    3656615353,
    3996768171,
    991055499,
    499776247,
    1265440854,
    648242737,
    3940784050,
    980351604,
    3713745714,
    1749149687,
    3396870395,
    4211799374,
    3640570775,
    1161844396,
    3125318951,
    1431517754,
    545492359,
    4268468663,
    3499529547,
    1437099964,
    2702547544,
    3433638243,
    2581715763,
    2787789398,
    1060185593,
    1593081372,
    2418618748,
    4260947970,
    69676912,
    2159744348,
    86519011,
    2512459080,
    3838209314,
    1220612927,
    3339683548,
    133810670,
    1090789135,
    1078426020,
    1569222167,
    845107691,
    3583754449,
    4072456591,
    1091646820,
    628848692,
    1613405280,
    3757631651,
    526609435,
    236106946,
    48312990,
    2942717905,
    3402727701,
    1797494240,
    859738849,
    992217954,
    4005476642,
    2243076622,
    3870952857,
    3732016268,
    765654824,
    3490871365,
    2511836413,
    1685915746,
    3888969200,
    1414112111,
    2273134842,
    3281911079,
    4080962846,
    172450625,
    2569994100,
    980381355,
    4109958455,
    2819808352,
    2716589560,
    2568741196,
    3681446669,
    3329971472,
    1835478071,
    660984891,
    3704678404,
    4045999559,
    3422617507,
    3040415634,
    1762651403,
    1719377915,
    3470491036,
    2693910283,
    3642056355,
    3138596744,
    1364962596,
    2073328063,
    1983633131,
    926494387,
    3423689081,
    2150032023,
    4096667949,
    1749200295,
    3328846651,
    309677260,
    2016342300,
    1779581495,
    3079819751,
    111262694,
    1274766160,
    443224088,
    298511866,
    1025883608,
    3806446537,
    1145181785,
    168956806,
    3641502830,
    3584813610,
    1689216846,
    3666258015,
    3200248200,
    1692713982,
    2646376535,
    4042768518,
    1618508792,
    1610833997,
    3523052358,
    4130873264,
    2001055236,
    3610705100,
    2202168115,
    4028541809,
    2961195399,
    1006657119,
    2006996926,
    3186142756,
    1430667929,
    3210227297,
    1314452623,
    4074634658,
    4101304120,
    2273951170,
    1399257539,
    3367210612,
    3027628629,
    1190975929,
    2062231137,
    2333990788,
    2221543033,
    2438960610,
    1181637006,
    548689776,
    2362791313,
    3372408396,
    3104550113,
    3145860560,
    296247880,
    1970579870,
    3078560182,
    3769228297,
    1714227617,
    3291629107,
    3898220290,
    166772364,
    1251581989,
    493813264,
    448347421,
    195405023,
    2709975567,
    677966185,
    3703036547,
    1463355134,
    2715995803,
    1338867538,
    1343315457,
    2802222074,
    2684532164,
    233230375,
    2599980071,
    2000651841,
    3277868038,
    1638401717,
    4028070440,
    3237316320,
    6314154,
    819756386,
    300326615,
    590932579,
    1405279636,
    3267499572,
    3150704214,
    2428286686,
    3959192993,
    3461946742,
    1862657033,
    1266418056,
    963775037,
    2089974820,
    2263052895,
    1917689273,
    448879540,
    3550394620,
    3981727096,
    150775221,
    3627908307,
    1303187396,
    508620638,
    2975983352,
    2726630617,
    1817252668,
    1876281319,
    1457606340,
    908771278,
    3720792119,
    3617206836,
    2455994898,
    1729034894,
    1080033504
  ],
  [
    976866871,
    3556439503,
    2881648439,
    1522871579,
    1555064734,
    1336096578,
    3548522304,
    2579274686,
    3574697629,
    3205460757,
    3593280638,
    3338716283,
    3079412587,
    564236357,
    2993598910,
    1781952180,
    1464380207,
    3163844217,
    3332601554,
    1699332808,
    1393555694,
    1183702653,
    3581086237,
    1288719814,
    691649499,
    2847557200,
    2895455976,
    3193889540,
    2717570544,
    1781354906,
    1676643554,
    2592534050,
    3230253752,
    1126444790,
    2770207658,
    2633158820,
    2210423226,
    2615765581,
    2414155088,
    3127139286,
    673620729,
    2805611233,
    1269405062,
    4015350505,
    3341807571,
    4149409754,
    1057255273,
    2012875353,
    2162469141,
    2276492801,
    2601117357,
    993977747,
    3918593370,
    2654263191,
    753973209,
    36408145,
    2530585658,
    25011837,
    3520020182,
    2088578344,
    530523599,
    2918365339,
    1524020338,
    1518925132,
    3760827505,
    3759777254,
    1202760957,
    3985898139,
    3906192525,
    674977740,
    4174734889,
    2031300136,
    2019492241,
    3983892565,
    4153806404,
    3822280332,
    352677332,
    2297720250,
    60907813,
    90501309,
    3286998549,
    1016092578,
    2535922412,
    2839152426,
    457141659,
    509813237,
    4120667899,
    652014361,
    1966332200,
    2975202805,
    55981186,
    2327461051,
    676427537,
    3255491064,
    2882294119,
    3433927263,
    1307055953,
    942726286,
    933058658,
    2468411793,
    3933900994,
    4215176142,
    1361170020,
    2001714738,
    2830558078,
    3274259782,
    1222529897,
    1679025792,
    2729314320,
    3714953764,
    1770335741,
    151462246,
    3013232138,
    1682292957,
    1483529935,
    471910574,
    1539241949,
    458788160,
    3436315007,
    1807016891,
    3718408830,
    978976581,
    1043663428,
    3165965781,
    1927990952,
    4200891579,
    2372276910,
    3208408903,
    3533431907,
    1412390302,
    2931980059,
    4132332400,
    1947078029,
    3881505623,
    4168226417,
    2941484381,
    1077988104,
    1320477388,
    886195818,
    18198404,
    3786409e3,
    2509781533,
    112762804,
    3463356488,
    1866414978,
    891333506,
    18488651,
    661792760,
    1628790961,
    3885187036,
    3141171499,
    876946877,
    2693282273,
    1372485963,
    791857591,
    2686433993,
    3759982718,
    3167212022,
    3472953795,
    2716379847,
    445679433,
    3561995674,
    3504004811,
    3574258232,
    54117162,
    3331405415,
    2381918588,
    3769707343,
    4154350007,
    1140177722,
    4074052095,
    668550556,
    3214352940,
    367459370,
    261225585,
    2610173221,
    4209349473,
    3468074219,
    3265815641,
    314222801,
    3066103646,
    3808782860,
    282218597,
    3406013506,
    3773591054,
    379116347,
    1285071038,
    846784868,
    2669647154,
    3771962079,
    3550491691,
    2305946142,
    453669953,
    1268987020,
    3317592352,
    3279303384,
    3744833421,
    2610507566,
    3859509063,
    266596637,
    3847019092,
    517658769,
    3462560207,
    3443424879,
    370717030,
    4247526661,
    2224018117,
    4143653529,
    4112773975,
    2788324899,
    2477274417,
    1456262402,
    2901442914,
    1517677493,
    1846949527,
    2295493580,
    3734397586,
    2176403920,
    1280348187,
    1908823572,
    3871786941,
    846861322,
    1172426758,
    3287448474,
    3383383037,
    1655181056,
    3139813346,
    901632758,
    1897031941,
    2986607138,
    3066810236,
    3447102507,
    1393639104,
    373351379,
    950779232,
    625454576,
    3124240540,
    4148612726,
    2007998917,
    544563296,
    2244738638,
    2330496472,
    2058025392,
    1291430526,
    424198748,
    50039436,
    29584100,
    3605783033,
    2429876329,
    2791104160,
    1057563949,
    3255363231,
    3075367218,
    3463963227,
    1469046755,
    985887462
  ]
];
Blowfish.prototype.PARRAY = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
Blowfish.prototype.NN = 16;
Blowfish.prototype._clean = function(xx) {
  if (xx < 0) {
    const yy = xx & 2147483647;
    xx = yy + 2147483648;
  }
  return xx;
};
Blowfish.prototype._F = function(xx) {
  let yy;
  const dd = xx & 255;
  xx >>>= 8;
  const cc = xx & 255;
  xx >>>= 8;
  const bb = xx & 255;
  xx >>>= 8;
  const aa = xx & 255;
  yy = this.sboxes[0][aa] + this.sboxes[1][bb];
  yy ^= this.sboxes[2][cc];
  yy += this.sboxes[3][dd];
  return yy;
};
Blowfish.prototype._encryptBlock = function(vals) {
  let dataL = vals[0];
  let dataR = vals[1];
  let ii;
  for (ii = 0; ii < this.NN; ++ii) {
    dataL ^= this.parray[ii];
    dataR = this._F(dataL) ^ dataR;
    const tmp = dataL;
    dataL = dataR;
    dataR = tmp;
  }
  dataL ^= this.parray[this.NN + 0];
  dataR ^= this.parray[this.NN + 1];
  vals[0] = this._clean(dataR);
  vals[1] = this._clean(dataL);
};
Blowfish.prototype.encryptBlock = function(vector) {
  let ii;
  const vals = [0, 0];
  const off = this.BLOCKSIZE / 2;
  for (ii = 0; ii < this.BLOCKSIZE / 2; ++ii) {
    vals[0] = vals[0] << 8 | vector[ii + 0] & 255;
    vals[1] = vals[1] << 8 | vector[ii + off] & 255;
  }
  this._encryptBlock(vals);
  const ret = [];
  for (ii = 0; ii < this.BLOCKSIZE / 2; ++ii) {
    ret[ii + 0] = vals[0] >>> 24 - 8 * ii & 255;
    ret[ii + off] = vals[1] >>> 24 - 8 * ii & 255;
  }
  return ret;
};
Blowfish.prototype._decryptBlock = function(vals) {
  let dataL = vals[0];
  let dataR = vals[1];
  let ii;
  for (ii = this.NN + 1; ii > 1; --ii) {
    dataL ^= this.parray[ii];
    dataR = this._F(dataL) ^ dataR;
    const tmp = dataL;
    dataL = dataR;
    dataR = tmp;
  }
  dataL ^= this.parray[1];
  dataR ^= this.parray[0];
  vals[0] = this._clean(dataR);
  vals[1] = this._clean(dataL);
};
Blowfish.prototype.init = function(key) {
  let ii;
  let jj = 0;
  this.parray = [];
  for (ii = 0; ii < this.NN + 2; ++ii) {
    let data = 0;
    for (let kk = 0; kk < 4; ++kk) {
      data = data << 8 | key[jj] & 255;
      if (++jj >= key.length) {
        jj = 0;
      }
    }
    this.parray[ii] = this.PARRAY[ii] ^ data;
  }
  this.sboxes = [];
  for (ii = 0; ii < 4; ++ii) {
    this.sboxes[ii] = [];
    for (jj = 0; jj < 256; ++jj) {
      this.sboxes[ii][jj] = this.SBOXES[ii][jj];
    }
  }
  const vals = [0, 0];
  for (ii = 0; ii < this.NN + 2; ii += 2) {
    this._encryptBlock(vals);
    this.parray[ii + 0] = vals[0];
    this.parray[ii + 1] = vals[1];
  }
  for (ii = 0; ii < 4; ++ii) {
    for (jj = 0; jj < 256; jj += 2) {
      this._encryptBlock(vals);
      this.sboxes[ii][jj + 0] = vals[0];
      this.sboxes[ii][jj + 1] = vals[1];
    }
  }
};
function BF(key) {
  this.bf = new Blowfish();
  this.bf.init(key);
  this.encrypt = function(block) {
    return this.bf.encryptBlock(block);
  };
}
BF.keySize = BF.prototype.keySize = 16;
BF.blockSize = BF.prototype.blockSize = 8;
var legacyCiphers = new Map(Object.entries({
  tripledes: TripleDES,
  cast5: CAST5,
  twofish: TF,
  blowfish: BF
}));
var legacy_ciphers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  legacyCiphers
});
function ADD64(a, i, b, j) {
  a[i] += b[j];
  a[i + 1] += b[j + 1] + (a[i] < b[j]);
}
function INC64(a, c) {
  a[0] += c;
  a[1] += a[0] < c;
}
function G$1(v, m, a, b, c, d, ix, iy) {
  ADD64(v, a, v, b);
  ADD64(v, a, m, ix);
  let xor0 = v[d] ^ v[a];
  let xor1 = v[d + 1] ^ v[a + 1];
  v[d] = xor1;
  v[d + 1] = xor0;
  ADD64(v, c, v, d);
  xor0 = v[b] ^ v[c];
  xor1 = v[b + 1] ^ v[c + 1];
  v[b] = xor0 >>> 24 ^ xor1 << 8;
  v[b + 1] = xor1 >>> 24 ^ xor0 << 8;
  ADD64(v, a, v, b);
  ADD64(v, a, m, iy);
  xor0 = v[d] ^ v[a];
  xor1 = v[d + 1] ^ v[a + 1];
  v[d] = xor0 >>> 16 ^ xor1 << 16;
  v[d + 1] = xor1 >>> 16 ^ xor0 << 16;
  ADD64(v, c, v, d);
  xor0 = v[b] ^ v[c];
  xor1 = v[b + 1] ^ v[c + 1];
  v[b] = xor1 >>> 31 ^ xor0 << 1;
  v[b + 1] = xor0 >>> 31 ^ xor1 << 1;
}
var BLAKE2B_IV32 = new Uint32Array([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var SIGMA = new Uint8Array([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3
].map((x) => x * 2));
function compress(S2, last) {
  const v = new Uint32Array(32);
  const m = new Uint32Array(S2.b.buffer, S2.b.byteOffset, 32);
  for (let i = 0; i < 16; i++) {
    v[i] = S2.h[i];
    v[i + 16] = BLAKE2B_IV32[i];
  }
  v[24] ^= S2.t0[0];
  v[25] ^= S2.t0[1];
  const f0 = last ? 4294967295 : 0;
  v[28] ^= f0;
  v[29] ^= f0;
  for (let i = 0; i < 12; i++) {
    const i16 = i << 4;
    G$1(v, m, 0, 8, 16, 24, SIGMA[i16 + 0], SIGMA[i16 + 1]);
    G$1(v, m, 2, 10, 18, 26, SIGMA[i16 + 2], SIGMA[i16 + 3]);
    G$1(v, m, 4, 12, 20, 28, SIGMA[i16 + 4], SIGMA[i16 + 5]);
    G$1(v, m, 6, 14, 22, 30, SIGMA[i16 + 6], SIGMA[i16 + 7]);
    G$1(v, m, 0, 10, 20, 30, SIGMA[i16 + 8], SIGMA[i16 + 9]);
    G$1(v, m, 2, 12, 22, 24, SIGMA[i16 + 10], SIGMA[i16 + 11]);
    G$1(v, m, 4, 14, 16, 26, SIGMA[i16 + 12], SIGMA[i16 + 13]);
    G$1(v, m, 6, 8, 18, 28, SIGMA[i16 + 14], SIGMA[i16 + 15]);
  }
  for (let i = 0; i < 16; i++) {
    S2.h[i] ^= v[i] ^ v[i + 16];
  }
}
var Blake2b = class {
  constructor(outlen, key, salt, personal) {
    const params = new Uint8Array(64);
    this.S = {
      b: new Uint8Array(BLOCKBYTES),
      h: new Uint32Array(OUTBYTES_MAX / 4),
      t0: new Uint32Array(2),
      // input counter `t`, lower 64-bits only
      c: 0,
      // `fill`, pointer within buffer, up to `BLOCKBYTES`
      outlen
      // output length in bytes
    };
    params[0] = outlen;
    if (key) params[1] = key.length;
    params[2] = 1;
    params[3] = 1;
    if (salt) params.set(salt, 32);
    if (personal) params.set(personal, 48);
    const params32 = new Uint32Array(params.buffer, params.byteOffset, params.length / Uint32Array.BYTES_PER_ELEMENT);
    for (let i = 0; i < 16; i++) {
      this.S.h[i] = BLAKE2B_IV32[i] ^ params32[i];
    }
    if (key) {
      const block = new Uint8Array(BLOCKBYTES);
      block.set(key);
      this.update(block);
    }
  }
  // Updates a BLAKE2b streaming hash
  // Requires Uint8Array (byte array)
  update(input) {
    if (!(input instanceof Uint8Array)) throw new Error("Input must be Uint8Array or Buffer");
    let i = 0;
    while (i < input.length) {
      if (this.S.c === BLOCKBYTES) {
        INC64(this.S.t0, this.S.c);
        compress(this.S, false);
        this.S.c = 0;
      }
      let left = BLOCKBYTES - this.S.c;
      this.S.b.set(input.subarray(i, i + left), this.S.c);
      const fill = Math.min(left, input.length - i);
      this.S.c += fill;
      i += fill;
    }
    return this;
  }
  /**
   * Return a BLAKE2b hash, either filling the given Uint8Array or allocating a new one
   * @param {Uint8Array} [prealloc] - optional preallocated buffer
   * @returns {ArrayBuffer} message digest
   */
  digest(prealloc) {
    INC64(this.S.t0, this.S.c);
    this.S.b.fill(0, this.S.c);
    this.S.c = BLOCKBYTES;
    compress(this.S, true);
    const out = prealloc || new Uint8Array(this.S.outlen);
    for (let i = 0; i < this.S.outlen; i++) {
      out[i] = this.S.h[i >> 2] >> 8 * (i & 3);
    }
    this.S.h = null;
    return out.buffer;
  }
};
function createHash(outlen, key, salt, personal) {
  if (outlen > OUTBYTES_MAX) throw new Error(`outlen must be at most ${OUTBYTES_MAX} (given: ${outlen})`);
  return new Blake2b(outlen, key, salt, personal);
}
var OUTBYTES_MAX = 64;
var BLOCKBYTES = 128;
var TYPE = 2;
var VERSION = 19;
var TAGBYTES_MAX = 4294967295;
var TAGBYTES_MIN = 4;
var SALTBYTES_MAX = 4294967295;
var SALTBYTES_MIN = 8;
var passwordBYTES_MAX = 4294967295;
var passwordBYTES_MIN = 8;
var MEMBYTES_MAX = 4294967295;
var ADBYTES_MAX = 4294967295;
var SECRETBYTES_MAX = 32;
var ARGON2_BLOCK_SIZE = 1024;
var ARGON2_PREHASH_DIGEST_LENGTH = 64;
var isLittleEndian = new Uint8Array(new Uint16Array([43981]).buffer)[0] === 205;
function LE32(buf, n, i) {
  buf[i + 0] = n;
  buf[i + 1] = n >> 8;
  buf[i + 2] = n >> 16;
  buf[i + 3] = n >> 24;
  return buf;
}
function LE64(buf, n, i) {
  if (n > Number.MAX_SAFE_INTEGER) throw new Error("LE64: large numbers unsupported");
  let remainder = n;
  for (let offset = i; offset < i + 7; offset++) {
    buf[offset] = remainder;
    remainder = (remainder - buf[offset]) / 256;
  }
  return buf;
}
function H_(outlen, X2, res) {
  const V = new Uint8Array(64);
  const V1_in = new Uint8Array(4 + X2.length);
  LE32(V1_in, outlen, 0);
  V1_in.set(X2, 4);
  if (outlen <= 64) {
    createHash(outlen).update(V1_in).digest(res);
    return res;
  }
  const r = Math.ceil(outlen / 32) - 2;
  for (let i = 0; i < r; i++) {
    createHash(64).update(i === 0 ? V1_in : V).digest(V);
    res.set(V.subarray(0, 32), i * 32);
  }
  const V_r1 = new Uint8Array(createHash(outlen - 32 * r).update(V).digest());
  res.set(V_r1, r * 32);
  return res;
}
function XOR(wasmContext, buf, xs, ys) {
  wasmContext.fn.XOR(
    buf.byteOffset,
    xs.byteOffset,
    ys.byteOffset
  );
  return buf;
}
function G(wasmContext, X2, Y2, R) {
  wasmContext.fn.G(
    X2.byteOffset,
    Y2.byteOffset,
    R.byteOffset,
    wasmContext.refs.gZ.byteOffset
  );
  return R;
}
function G2(wasmContext, X2, Y2, R) {
  wasmContext.fn.G2(
    X2.byteOffset,
    Y2.byteOffset,
    R.byteOffset,
    wasmContext.refs.gZ.byteOffset
  );
  return R;
}
function* makePRNG(wasmContext, pass, lane, slice2, m_, totalPasses, segmentLength, segmentOffset) {
  wasmContext.refs.prngTmp.fill(0);
  const Z2 = wasmContext.refs.prngTmp.subarray(0, 6 * 8);
  LE64(Z2, pass, 0);
  LE64(Z2, lane, 8);
  LE64(Z2, slice2, 16);
  LE64(Z2, m_, 24);
  LE64(Z2, totalPasses, 32);
  LE64(Z2, TYPE, 40);
  for (let i = 1; i <= segmentLength; i++) {
    LE64(wasmContext.refs.prngTmp, i, Z2.length);
    const g2 = G2(wasmContext, wasmContext.refs.ZERO1024, wasmContext.refs.prngTmp, wasmContext.refs.prngR);
    for (let k = i === 1 ? segmentOffset * 8 : 0; k < g2.length; k += 8) {
      yield g2.subarray(k, k + 8);
    }
  }
  return [];
}
function validateParams({ type, version: version2, tagLength: tagLength2, password, salt, ad, secret, parallelism, memorySize, passes }) {
  const assertLength = (name2, value, min, max2) => {
    if (value < min || value > max2) {
      throw new Error(`${name2} size should be between ${min} and ${max2} bytes`);
    }
  };
  if (type !== TYPE || version2 !== VERSION) throw new Error("Unsupported type or version");
  assertLength("password", password, passwordBYTES_MIN, passwordBYTES_MAX);
  assertLength("salt", salt, SALTBYTES_MIN, SALTBYTES_MAX);
  assertLength("tag", tagLength2, TAGBYTES_MIN, TAGBYTES_MAX);
  assertLength("memory", memorySize, 8 * parallelism, MEMBYTES_MAX);
  ad && assertLength("associated data", ad, 0, ADBYTES_MAX);
  secret && assertLength("secret", secret, 0, SECRETBYTES_MAX);
  return { type, version: version2, tagLength: tagLength2, password, salt, ad, secret, lanes: parallelism, memorySize, passes };
}
var KB = 1024;
var WASM_PAGE_SIZE = 64 * KB;
function argon2id(params, { memory, instance: wasmInstance }) {
  if (!isLittleEndian) throw new Error("BigEndian system not supported");
  const ctx = validateParams({ type: TYPE, version: VERSION, ...params });
  const { G: wasmG, G2: wasmG2, xor: wasmXOR, getLZ: wasmLZ } = wasmInstance.exports;
  const wasmRefs = {};
  const wasmFn = {};
  wasmFn.G = wasmG;
  wasmFn.G2 = wasmG2;
  wasmFn.XOR = wasmXOR;
  const m_ = 4 * ctx.lanes * Math.floor(ctx.memorySize / (4 * ctx.lanes));
  const requiredMemory = m_ * ARGON2_BLOCK_SIZE + 10 * KB;
  if (memory.buffer.byteLength < requiredMemory) {
    const missing = Math.ceil((requiredMemory - memory.buffer.byteLength) / WASM_PAGE_SIZE);
    memory.grow(missing);
  }
  let offset = 0;
  wasmRefs.gZ = new Uint8Array(memory.buffer, offset, ARGON2_BLOCK_SIZE);
  offset += wasmRefs.gZ.length;
  wasmRefs.prngR = new Uint8Array(memory.buffer, offset, ARGON2_BLOCK_SIZE);
  offset += wasmRefs.prngR.length;
  wasmRefs.prngTmp = new Uint8Array(memory.buffer, offset, ARGON2_BLOCK_SIZE);
  offset += wasmRefs.prngTmp.length;
  wasmRefs.ZERO1024 = new Uint8Array(memory.buffer, offset, 1024);
  offset += wasmRefs.ZERO1024.length;
  const lz = new Uint32Array(memory.buffer, offset, 2);
  offset += lz.length * Uint32Array.BYTES_PER_ELEMENT;
  const wasmContext = { fn: wasmFn, refs: wasmRefs };
  const newBlock = new Uint8Array(memory.buffer, offset, ARGON2_BLOCK_SIZE);
  offset += newBlock.length;
  const blockMemory = new Uint8Array(memory.buffer, offset, ctx.memorySize * ARGON2_BLOCK_SIZE);
  const allocatedMemory = new Uint8Array(memory.buffer, 0, offset);
  const H0 = getH0(ctx);
  const q = m_ / ctx.lanes;
  const B = new Array(ctx.lanes).fill(null).map(() => new Array(q));
  const initBlock = (i, j) => {
    B[i][j] = blockMemory.subarray(i * q * 1024 + j * 1024, i * q * 1024 + j * 1024 + ARGON2_BLOCK_SIZE);
    return B[i][j];
  };
  for (let i = 0; i < ctx.lanes; i++) {
    const tmp = new Uint8Array(H0.length + 8);
    tmp.set(H0);
    LE32(tmp, 0, H0.length);
    LE32(tmp, i, H0.length + 4);
    H_(ARGON2_BLOCK_SIZE, tmp, initBlock(i, 0));
    LE32(tmp, 1, H0.length);
    H_(ARGON2_BLOCK_SIZE, tmp, initBlock(i, 1));
  }
  const SL = 4;
  const segmentLength = q / SL;
  for (let pass = 0; pass < ctx.passes; pass++) {
    for (let sl = 0; sl < SL; sl++) {
      const isDataIndependent = pass === 0 && sl <= 1;
      for (let i = 0; i < ctx.lanes; i++) {
        let segmentOffset = sl === 0 && pass === 0 ? 2 : 0;
        const PRNG = isDataIndependent ? makePRNG(wasmContext, pass, i, sl, m_, ctx.passes, segmentLength, segmentOffset) : null;
        for (segmentOffset; segmentOffset < segmentLength; segmentOffset++) {
          const j = sl * segmentLength + segmentOffset;
          const prevBlock = j > 0 ? B[i][j - 1] : B[i][q - 1];
          const J1J2 = isDataIndependent ? PRNG.next().value : prevBlock;
          wasmLZ(lz.byteOffset, J1J2.byteOffset, i, ctx.lanes, pass, sl, segmentOffset, SL, segmentLength);
          const l = lz[0];
          const z = lz[1];
          if (pass === 0) initBlock(i, j);
          G(wasmContext, prevBlock, B[l][z], pass > 0 ? newBlock : B[i][j]);
          if (pass > 0) XOR(wasmContext, B[i][j], newBlock, B[i][j]);
        }
      }
    }
  }
  const C = B[0][q - 1];
  for (let i = 1; i < ctx.lanes; i++) {
    XOR(wasmContext, C, C, B[i][q - 1]);
  }
  const tag = H_(ctx.tagLength, C, new Uint8Array(ctx.tagLength));
  allocatedMemory.fill(0);
  memory.grow(0);
  return tag;
}
function getH0(ctx) {
  const H = createHash(ARGON2_PREHASH_DIGEST_LENGTH);
  const ZERO32 = new Uint8Array(4);
  const params = new Uint8Array(24);
  LE32(params, ctx.lanes, 0);
  LE32(params, ctx.tagLength, 4);
  LE32(params, ctx.memorySize, 8);
  LE32(params, ctx.passes, 12);
  LE32(params, ctx.version, 16);
  LE32(params, ctx.type, 20);
  const toHash = [params];
  if (ctx.password) {
    toHash.push(LE32(new Uint8Array(4), ctx.password.length, 0));
    toHash.push(ctx.password);
  } else {
    toHash.push(ZERO32);
  }
  if (ctx.salt) {
    toHash.push(LE32(new Uint8Array(4), ctx.salt.length, 0));
    toHash.push(ctx.salt);
  } else {
    toHash.push(ZERO32);
  }
  if (ctx.secret) {
    toHash.push(LE32(new Uint8Array(4), ctx.secret.length, 0));
    toHash.push(ctx.secret);
  } else {
    toHash.push(ZERO32);
  }
  if (ctx.ad) {
    toHash.push(LE32(new Uint8Array(4), ctx.ad.length, 0));
    toHash.push(ctx.ad);
  } else {
    toHash.push(ZERO32);
  }
  H.update(concatArrays(toHash));
  const outputBuffer = H.digest();
  return new Uint8Array(outputBuffer);
}
function concatArrays(arrays) {
  if (arrays.length === 1) return arrays[0];
  let totalLength = 0;
  for (let i = 0; i < arrays.length; i++) {
    if (!(arrays[i] instanceof Uint8Array)) {
      throw new Error("concatArrays: Data must be in the form of a Uint8Array");
    }
    totalLength += arrays[i].length;
  }
  const result = new Uint8Array(totalLength);
  let pos2 = 0;
  arrays.forEach((element) => {
    result.set(element, pos2);
    pos2 += element.length;
  });
  return result;
}
var isSIMDSupported;
async function wasmLoader(memory, getSIMD, getNonSIMD) {
  const importObject = { env: { memory } };
  if (isSIMDSupported === void 0) {
    try {
      const loaded = await getSIMD(importObject);
      isSIMDSupported = true;
      return loaded;
    } catch (e) {
      isSIMDSupported = false;
    }
  }
  const loader = isSIMDSupported ? getSIMD : getNonSIMD;
  return loader(importObject);
}
async function setupWasm(getSIMD, getNonSIMD) {
  const memory = new WebAssembly.Memory({
    // in pages of 64KiB each
    // these values need to be compatible with those declared when building in `build-wasm`
    initial: 1040,
    // 65MB
    maximum: 65536
    // 4GB
  });
  const wasmModule = await wasmLoader(memory, getSIMD, getNonSIMD);
  const computeHash = (params) => argon2id(params, { instance: wasmModule.instance, memory });
  return computeHash;
}
function _loadWasmModule(sync, filepath, src, imports) {
  function _instantiateOrCompile(source, imports2, stream2) {
    var instantiateFunc = WebAssembly.instantiate;
    var compileFunc = WebAssembly.compile;
    if (imports2) {
      return instantiateFunc(source, imports2);
    } else {
      return compileFunc(source);
    }
  }
  var buf = null;
  buf = Buffer.from(src, "base64");
  {
    return _instantiateOrCompile(buf, imports);
  }
}
function wasmSIMD(imports) {
  return _loadWasmModule(0, null, "AGFzbQEAAAABKwdgBH9/f38AYAABf2AAAGADf39/AGAJf39/f39/f39/AX9gAX8AYAF/AX8CEwEDZW52Bm1lbW9yeQIBkAiAgAQDCgkCAwAABAEFBgEEBQFwAQICBgkBfwFBkIjAAgsHfQoDeG9yAAEBRwACAkcyAAMFZ2V0TFoABBlfX2luZGlyZWN0X2Z1bmN0aW9uX3RhYmxlAQALX2luaXRpYWxpemUAABBfX2Vycm5vX2xvY2F0aW9uAAgJc3RhY2tTYXZlAAUMc3RhY2tSZXN0b3JlAAYKc3RhY2tBbGxvYwAHCQcBAEEBCwEACs0gCQMAAQtYAQJ/A0AgACAEQQR0IgNqIAIgA2r9AAQAIAEgA2r9AAQA/VH9CwQAIAAgA0EQciIDaiACIANq/QAEACABIANq/QAEAP1R/QsEACAEQQJqIgRBwABHDQALC7ceAgt7A38DQCADIBFBBHQiD2ogASAPav0ABAAgACAPav0ABAD9USIF/QsEACACIA9qIAX9CwQAIAMgD0EQciIPaiABIA9q/QAEACAAIA9q/QAEAP1RIgX9CwQAIAIgD2ogBf0LBAAgEUECaiIRQcAARw0ACwNAIAMgEEEHdGoiAEEQaiAA/QAEcCAA/QAEMCIFIAD9AAQQIgT9zgEgBSAF/Q0AAQIDCAkKCwABAgMICQoLIAQgBP0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgT9USIJQSD9ywEgCUEg/c0B/VAiCSAA/QAEUCIG/c4BIAkgCf0NAAECAwgJCgsAAQIDCAkKCyAGIAb9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIGIAX9USIFQSj9ywEgBUEY/c0B/VAiCCAE/c4BIAggCP0NAAECAwgJCgsAAQIDCAkKCyAEIAT9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIKIAogCf1RIgVBMP3LASAFQRD9zQH9UCIFIAb9zgEgBSAF/Q0AAQIDCAkKCwABAgMICQoLIAYgBv0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgkgCP1RIgRBAf3LASAEQT/9zQH9UCIMIAD9AARgIAD9AAQgIgQgAP0ABAAiBv3OASAEIAT9DQABAgMICQoLAAECAwgJCgsgBiAG/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiBv1RIghBIP3LASAIQSD9zQH9UCIIIABBQGsiAf0ABAAiB/3OASAIIAj9DQABAgMICQoLAAECAwgJCgsgByAH/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiByAE/VEiBEEo/csBIARBGP3NAf1QIgsgBv3OASALIAv9DQABAgMICQoLAAECAwgJCgsgBiAG/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiBiAI/VEiBEEw/csBIARBEP3NAf1QIgQgB/3OASAEIAT9DQABAgMICQoLAAECAwgJCgsgByAH/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiCCAL/VEiB0EB/csBIAdBP/3NAf1QIg0gDf0NAAECAwQFBgcQERITFBUWF/0NCAkKCwwNDg8YGRobHB0eHyIH/c4BIAcgB/0NAAECAwgJCgsAAQIDCAkKCyAKIAr9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIKIAQgBSAF/Q0AAQIDBAUGBxAREhMUFRYX/Q0ICQoLDA0ODxgZGhscHR4f/VEiC0Eg/csBIAtBIP3NAf1QIgsgCP3OASALIAv9DQABAgMICQoLAAECAwgJCgsgCCAI/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiCCAH/VEiB0Eo/csBIAdBGP3NAf1QIgcgCv3OASAHIAf9DQABAgMICQoLAAECAwgJCgsgCiAK/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiDv0LBAAgACAGIA0gDCAM/Q0AAQIDBAUGBxAREhMUFRYX/Q0ICQoLDA0ODxgZGhscHR4fIgr9zgEgCiAK/Q0AAQIDCAkKCwABAgMICQoLIAYgBv0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgYgBSAEIAT9DQABAgMEBQYHEBESExQVFhf9DQgJCgsMDQ4PGBkaGxwdHh/9USIFQSD9ywEgBUEg/c0B/VAiBSAJ/c4BIAUgBf0NAAECAwgJCgsAAQIDCAkKCyAJIAn9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIJIAr9USIEQSj9ywEgBEEY/c0B/VAiCiAG/c4BIAogCv0NAAECAwgJCgsAAQIDCAkKCyAGIAb9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIE/QsEACAAIAQgBf1RIgVBMP3LASAFQRD9zQH9UCIFIA4gC/1RIgRBMP3LASAEQRD9zQH9UCIEIAT9DQABAgMEBQYHEBESExQVFhf9DQgJCgsMDQ4PGBkaGxwdHh/9CwRgIAAgBCAFIAX9DQABAgMEBQYHEBESExQVFhf9DQgJCgsMDQ4PGBkaGxwdHh/9CwRwIAEgBCAI/c4BIAQgBP0NAAECAwgJCgsAAQIDCAkKCyAIIAj9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIE/QsEACAAIAUgCf3OASAFIAX9DQABAgMICQoLAAECAwgJCgsgCSAJ/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiCf0LBFAgACAEIAf9USIFQQH9ywEgBUE//c0B/VAiBSAJIAr9USIEQQH9ywEgBEE//c0B/VAiBCAE/Q0AAQIDBAUGBxAREhMUFRYX/Q0ICQoLDA0ODxgZGhscHR4f/QsEICAAIAQgBSAF/Q0AAQIDBAUGBxAREhMUFRYX/Q0ICQoLDA0ODxgZGhscHR4f/QsEMCAQQQFqIhBBCEcNAAtBACEQA0AgAyAQQQR0aiIAQYABaiAA/QAEgAcgAP0ABIADIgUgAP0ABIABIgT9zgEgBSAF/Q0AAQIDCAkKCwABAgMICQoLIAQgBP0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgT9USIJQSD9ywEgCUEg/c0B/VAiCSAA/QAEgAUiBv3OASAJIAn9DQABAgMICQoLAAECAwgJCgsgBiAG/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiBiAF/VEiBUEo/csBIAVBGP3NAf1QIgggBP3OASAIIAj9DQABAgMICQoLAAECAwgJCgsgBCAE/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiCiAKIAn9USIFQTD9ywEgBUEQ/c0B/VAiBSAG/c4BIAUgBf0NAAECAwgJCgsAAQIDCAkKCyAGIAb9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIJIAj9USIEQQH9ywEgBEE//c0B/VAiDCAA/QAEgAYgAP0ABIACIgQgAP0ABAAiBv3OASAEIAT9DQABAgMICQoLAAECAwgJCgsgBiAG/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiBv1RIghBIP3LASAIQSD9zQH9UCIIIAD9AASABCIH/c4BIAggCP0NAAECAwgJCgsAAQIDCAkKCyAHIAf9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIHIAT9USIEQSj9ywEgBEEY/c0B/VAiCyAG/c4BIAsgC/0NAAECAwgJCgsAAQIDCAkKCyAGIAb9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIGIAj9USIEQTD9ywEgBEEQ/c0B/VAiBCAH/c4BIAQgBP0NAAECAwgJCgsAAQIDCAkKCyAHIAf9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIIIAv9USIHQQH9ywEgB0E//c0B/VAiDSAN/Q0AAQIDBAUGBxAREhMUFRYX/Q0ICQoLDA0ODxgZGhscHR4fIgf9zgEgByAH/Q0AAQIDCAkKCwABAgMICQoLIAogCv0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgogBCAFIAX9DQABAgMEBQYHEBESExQVFhf9DQgJCgsMDQ4PGBkaGxwdHh/9USILQSD9ywEgC0Eg/c0B/VAiCyAI/c4BIAsgC/0NAAECAwgJCgsAAQIDCAkKCyAIIAj9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIIIAf9USIHQSj9ywEgB0EY/c0B/VAiByAK/c4BIAcgB/0NAAECAwgJCgsAAQIDCAkKCyAKIAr9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIO/QsEACAAIAYgDSAMIAz9DQABAgMEBQYHEBESExQVFhf9DQgJCgsMDQ4PGBkaGxwdHh8iCv3OASAKIAr9DQABAgMICQoLAAECAwgJCgsgBiAG/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiBiAFIAQgBP0NAAECAwQFBgcQERITFBUWF/0NCAkKCwwNDg8YGRobHB0eH/1RIgVBIP3LASAFQSD9zQH9UCIFIAn9zgEgBSAF/Q0AAQIDCAkKCwABAgMICQoLIAkgCf0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgkgCv1RIgRBKP3LASAEQRj9zQH9UCIKIAb9zgEgCiAK/Q0AAQIDCAkKCwABAgMICQoLIAYgBv0NAAECAwgJCgsAAQIDCAkKC/3eAUEB/csB/c4BIgT9CwQAIAAgBCAF/VEiBUEw/csBIAVBEP3NAf1QIgUgDiAL/VEiBEEw/csBIARBEP3NAf1QIgQgBP0NAAECAwQFBgcQERITFBUWF/0NCAkKCwwNDg8YGRobHB0eH/0LBIAGIAAgBCAFIAX9DQABAgMEBQYHEBESExQVFhf9DQgJCgsMDQ4PGBkaGxwdHh/9CwSAByAAIAQgCP3OASAEIAT9DQABAgMICQoLAAECAwgJCgsgCCAI/Q0AAQIDCAkKCwABAgMICQoL/d4BQQH9ywH9zgEiBP0LBIAEIAAgBSAJ/c4BIAUgBf0NAAECAwgJCgsAAQIDCAkKCyAJIAn9DQABAgMICQoLAAECAwgJCgv93gFBAf3LAf3OASIJ/QsEgAUgACAEIAf9USIFQQH9ywEgBUE//c0B/VAiBSAJIAr9USIEQQH9ywEgBEE//c0B/VAiBCAE/Q0AAQIDBAUGBxAREhMUFRYX/Q0ICQoLDA0ODxgZGhscHR4f/QsEgAIgACAEIAUgBf0NAAECAwQFBgcQERITFBUWF/0NCAkKCwwNDg8YGRobHB0eH/0LBIADIBBBAWoiEEEIRw0AC0EAIRADQCACIBBBBHQiAGoiASAAIANq/QAEACAB/QAEAP1R/QsEACACIABBEHIiAWoiDyABIANq/QAEACAP/QAEAP1R/QsEACACIABBIHIiAWoiDyABIANq/QAEACAP/QAEAP1R/QsEACACIABBMHIiAGoiASAAIANq/QAEACAB/QAEAP1R/QsEACAQQQRqIhBBwABHDQALCxYAIAAgASACIAMQAiAAIAIgAiADEAILewIBfwF+IAIhCSABNQIAIQogBCAFcgRAIAEoAgQgA3AhCQsgACAJNgIAIAAgB0EBayAFIAQbIAhsIAZBAWtBAEF/IAYbIAIgCUYbaiIBIAVBAWogCGxBACAEG2ogAa0gCiAKfkIgiH5CIIinQX9zaiAHIAhscDYCBCAACwQAIwALBgAgACQACxAAIwAgAGtBcHEiACQAIAALBQBBgAgL", imports);
}
function wasmNonSIMD(imports) {
  return _loadWasmModule(0, null, "AGFzbQEAAAABPwhgBH9/f38AYAABf2AAAGADf39/AGARf39/f39/f39/f39/f39/f38AYAl/f39/f39/f38Bf2ABfwBgAX8BfwITAQNlbnYGbWVtb3J5AgGQCICABAMLCgIDBAAABQEGBwEEBQFwAQICBgkBfwFBkIjAAgsHfQoDeG9yAAEBRwADAkcyAAQFZ2V0TFoABRlfX2luZGlyZWN0X2Z1bmN0aW9uX3RhYmxlAQALX2luaXRpYWxpemUAABBfX2Vycm5vX2xvY2F0aW9uAAkJc3RhY2tTYXZlAAYMc3RhY2tSZXN0b3JlAAcKc3RhY2tBbGxvYwAICQcBAEEBCwEACssaCgMAAQtQAQJ/A0AgACAEQQN0IgNqIAIgA2opAwAgASADaikDAIU3AwAgACADQQhyIgNqIAIgA2opAwAgASADaikDAIU3AwAgBEECaiIEQYABRw0ACwveDwICfgF/IAAgAUEDdGoiEyATKQMAIhEgACAFQQN0aiIBKQMAIhJ8IBFCAYZC/v///x+DIBJC/////w+DfnwiETcDACAAIA1BA3RqIgUgESAFKQMAhUIgiSIRNwMAIAAgCUEDdGoiCSARIAkpAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAEgESABKQMAhUIoiSIRNwMAIBMgESATKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACAFIBEgBSkDAIVCMIkiETcDACAJIBEgCSkDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgASARIAEpAwCFQgGJNwMAIAAgAkEDdGoiDSANKQMAIhEgACAGQQN0aiICKQMAIhJ8IBFCAYZC/v///x+DIBJC/////w+DfnwiETcDACAAIA5BA3RqIgYgESAGKQMAhUIgiSIRNwMAIAAgCkEDdGoiCiARIAopAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAIgESACKQMAhUIoiSIRNwMAIA0gESANKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACAGIBEgBikDAIVCMIkiETcDACAKIBEgCikDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgAiARIAIpAwCFQgGJNwMAIAAgA0EDdGoiDiAOKQMAIhEgACAHQQN0aiIDKQMAIhJ8IBFCAYZC/v///x+DIBJC/////w+DfnwiETcDACAAIA9BA3RqIgcgESAHKQMAhUIgiSIRNwMAIAAgC0EDdGoiCyARIAspAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAMgESADKQMAhUIoiSIRNwMAIA4gESAOKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACAHIBEgBykDAIVCMIkiETcDACALIBEgCykDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgAyARIAMpAwCFQgGJNwMAIAAgBEEDdGoiDyAPKQMAIhEgACAIQQN0aiIEKQMAIhJ8IBFCAYZC/v///x+DIBJC/////w+DfnwiETcDACAAIBBBA3RqIgggESAIKQMAhUIgiSIRNwMAIAAgDEEDdGoiACARIAApAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAQgESAEKQMAhUIoiSIRNwMAIA8gESAPKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACAIIBEgCCkDAIVCMIkiETcDACAAIBEgACkDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgBCARIAQpAwCFQgGJNwMAIBMgEykDACIRIAIpAwAiEnwgEUIBhkL+////H4MgEkL/////D4N+fCIRNwMAIAggESAIKQMAhUIgiSIRNwMAIAsgESALKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACACIBEgAikDAIVCKIkiETcDACATIBEgEykDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgCCARIAgpAwCFQjCJIhE3AwAgCyARIAspAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAIgESACKQMAhUIBiTcDACANIA0pAwAiESADKQMAIhJ8IBFCAYZC/v///x+DIBJC/////w+DfnwiETcDACAFIBEgBSkDAIVCIIkiETcDACAAIBEgACkDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgAyARIAMpAwCFQiiJIhE3AwAgDSARIA0pAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAUgESAFKQMAhUIwiSIRNwMAIAAgESAAKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACADIBEgAykDAIVCAYk3AwAgDiAOKQMAIhEgBCkDACISfCARQgGGQv7///8fgyASQv////8Pg358IhE3AwAgBiARIAYpAwCFQiCJIhE3AwAgCSARIAkpAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAQgESAEKQMAhUIoiSIRNwMAIA4gESAOKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACAGIBEgBikDAIVCMIkiETcDACAJIBEgCSkDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgBCARIAQpAwCFQgGJNwMAIA8gDykDACIRIAEpAwAiEnwgEUIBhkL+////H4MgEkL/////D4N+fCIRNwMAIAcgESAHKQMAhUIgiSIRNwMAIAogESAKKQMAIhJ8IBFC/////w+DIBJCAYZC/v///x+DfnwiETcDACABIBEgASkDAIVCKIkiETcDACAPIBEgDykDACISfCARQv////8PgyASQgGGQv7///8fg358IhE3AwAgByARIAcpAwCFQjCJIhE3AwAgCiARIAopAwAiEnwgEUL/////D4MgEkIBhkL+////H4N+fCIRNwMAIAEgESABKQMAhUIBiTcDAAvdCAEPfwNAIAIgBUEDdCIGaiABIAZqKQMAIAAgBmopAwCFNwMAIAIgBkEIciIGaiABIAZqKQMAIAAgBmopAwCFNwMAIAVBAmoiBUGAAUcNAAsDQCADIARBA3QiAGogACACaikDADcDACADIARBAXIiAEEDdCIBaiABIAJqKQMANwMAIAMgBEECciIBQQN0IgVqIAIgBWopAwA3AwAgAyAEQQNyIgVBA3QiBmogAiAGaikDADcDACADIARBBHIiBkEDdCIHaiACIAdqKQMANwMAIAMgBEEFciIHQQN0IghqIAIgCGopAwA3AwAgAyAEQQZyIghBA3QiCWogAiAJaikDADcDACADIARBB3IiCUEDdCIKaiACIApqKQMANwMAIAMgBEEIciIKQQN0IgtqIAIgC2opAwA3AwAgAyAEQQlyIgtBA3QiDGogAiAMaikDADcDACADIARBCnIiDEEDdCINaiACIA1qKQMANwMAIAMgBEELciINQQN0Ig5qIAIgDmopAwA3AwAgAyAEQQxyIg5BA3QiD2ogAiAPaikDADcDACADIARBDXIiD0EDdCIQaiACIBBqKQMANwMAIAMgBEEOciIQQQN0IhFqIAIgEWopAwA3AwAgAyAEQQ9yIhFBA3QiEmogAiASaikDADcDACADIARB//8DcSAAQf//A3EgAUH//wNxIAVB//8DcSAGQf//A3EgB0H//wNxIAhB//8DcSAJQf//A3EgCkH//wNxIAtB//8DcSAMQf//A3EgDUH//wNxIA5B//8DcSAPQf//A3EgEEH//wNxIBFB//8DcRACIARB8ABJIQAgBEEQaiEEIAANAAtBACEBIANBAEEBQRBBEUEgQSFBMEExQcAAQcEAQdAAQdEAQeAAQeEAQfAAQfEAEAIgA0ECQQNBEkETQSJBI0EyQTNBwgBBwwBB0gBB0wBB4gBB4wBB8gBB8wAQAiADQQRBBUEUQRVBJEElQTRBNUHEAEHFAEHUAEHVAEHkAEHlAEH0AEH1ABACIANBBkEHQRZBF0EmQSdBNkE3QcYAQccAQdYAQdcAQeYAQecAQfYAQfcAEAIgA0EIQQlBGEEZQShBKUE4QTlByABByQBB2ABB2QBB6ABB6QBB+ABB+QAQAiADQQpBC0EaQRtBKkErQTpBO0HKAEHLAEHaAEHbAEHqAEHrAEH6AEH7ABACIANBDEENQRxBHUEsQS1BPEE9QcwAQc0AQdwAQd0AQewAQe0AQfwAQf0AEAIgA0EOQQ9BHkEfQS5BL0E+QT9BzgBBzwBB3gBB3wBB7gBB7wBB/gBB/wAQAgNAIAIgAUEDdCIAaiIEIAAgA2opAwAgBCkDAIU3AwAgAiAAQQhyIgRqIgUgAyAEaikDACAFKQMAhTcDACACIABBEHIiBGoiBSADIARqKQMAIAUpAwCFNwMAIAIgAEEYciIAaiIEIAAgA2opAwAgBCkDAIU3AwAgAUEEaiIBQYABRw0ACwsWACAAIAEgAiADEAMgACACIAIgAxADC3sCAX8BfiACIQkgATUCACEKIAQgBXIEQCABKAIEIANwIQkLIAAgCTYCACAAIAdBAWsgBSAEGyAIbCAGQQFrQQBBfyAGGyACIAlGG2oiASAFQQFqIAhsQQAgBBtqIAGtIAogCn5CIIh+QiCIp0F/c2ogByAIbHA2AgQgAAsEACMACwYAIAAkAAsQACMAIABrQXBxIgAkACAACwUAQYAICw==", imports);
}
var loadWasm = async () => setupWasm(
  (instanceObject) => wasmSIMD(instanceObject),
  (instanceObject) => wasmNonSIMD(instanceObject)
);
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: loadWasm
});
var BITMASK = [0, 1, 3, 7, 15, 31, 63, 127, 255];
var BitReader$1 = function(stream2) {
  this.stream = stream2;
  this.bitOffset = 0;
  this.curByte = 0;
  this.hasByte = false;
};
BitReader$1.prototype._ensureByte = function() {
  if (!this.hasByte) {
    this.curByte = this.stream.readByte();
    this.hasByte = true;
  }
};
BitReader$1.prototype.read = function(bits2) {
  var result = 0;
  while (bits2 > 0) {
    this._ensureByte();
    var remaining = 8 - this.bitOffset;
    if (bits2 >= remaining) {
      result <<= remaining;
      result |= BITMASK[remaining] & this.curByte;
      this.hasByte = false;
      this.bitOffset = 0;
      bits2 -= remaining;
    } else {
      result <<= bits2;
      var shift = remaining - bits2;
      result |= (this.curByte & BITMASK[bits2] << shift) >> shift;
      this.bitOffset += bits2;
      bits2 = 0;
    }
  }
  return result;
};
BitReader$1.prototype.seek = function(pos2) {
  var n_bit = pos2 % 8;
  var n_byte = (pos2 - n_bit) / 8;
  this.bitOffset = n_bit;
  this.stream.seek(n_byte);
  this.hasByte = false;
};
BitReader$1.prototype.pi = function() {
  var buf = new Uint8Array(6), i;
  for (i = 0; i < buf.length; i++) {
    buf[i] = this.read(8);
  }
  return bufToHex(buf);
};
function bufToHex(buf) {
  return Array.prototype.map.call(buf, (x) => ("00" + x.toString(16)).slice(-2)).join("");
}
var bitreader = BitReader$1;
var Stream$1 = function() {
};
Stream$1.prototype.readByte = function() {
  throw new Error("abstract method readByte() not implemented");
};
Stream$1.prototype.read = function(buffer, bufOffset, length) {
  var bytesRead = 0;
  while (bytesRead < length) {
    var c = this.readByte();
    if (c < 0) {
      return bytesRead === 0 ? -1 : bytesRead;
    }
    buffer[bufOffset++] = c;
    bytesRead++;
  }
  return bytesRead;
};
Stream$1.prototype.seek = function(new_pos) {
  throw new Error("abstract method seek() not implemented");
};
Stream$1.prototype.writeByte = function(_byte) {
  throw new Error("abstract method readByte() not implemented");
};
Stream$1.prototype.write = function(buffer, bufOffset, length) {
  var i;
  for (i = 0; i < length; i++) {
    this.writeByte(buffer[bufOffset++]);
  }
  return length;
};
Stream$1.prototype.flush = function() {
};
var stream = Stream$1;
var crc32 = function() {
  var crc32Lookup = new Uint32Array([
    0,
    79764919,
    159529838,
    222504665,
    319059676,
    398814059,
    445009330,
    507990021,
    638119352,
    583659535,
    797628118,
    726387553,
    890018660,
    835552979,
    1015980042,
    944750013,
    1276238704,
    1221641927,
    1167319070,
    1095957929,
    1595256236,
    1540665371,
    1452775106,
    1381403509,
    1780037320,
    1859660671,
    1671105958,
    1733955601,
    2031960084,
    2111593891,
    1889500026,
    1952343757,
    2552477408,
    2632100695,
    2443283854,
    2506133561,
    2334638140,
    2414271883,
    2191915858,
    2254759653,
    3190512472,
    3135915759,
    3081330742,
    3009969537,
    2905550212,
    2850959411,
    2762807018,
    2691435357,
    3560074640,
    3505614887,
    3719321342,
    3648080713,
    3342211916,
    3287746299,
    3467911202,
    3396681109,
    4063920168,
    4143685023,
    4223187782,
    4286162673,
    3779000052,
    3858754371,
    3904687514,
    3967668269,
    881225847,
    809987520,
    1023691545,
    969234094,
    662832811,
    591600412,
    771767749,
    717299826,
    311336399,
    374308984,
    453813921,
    533576470,
    25881363,
    88864420,
    134795389,
    214552010,
    2023205639,
    2086057648,
    1897238633,
    1976864222,
    1804852699,
    1867694188,
    1645340341,
    1724971778,
    1587496639,
    1516133128,
    1461550545,
    1406951526,
    1302016099,
    1230646740,
    1142491917,
    1087903418,
    2896545431,
    2825181984,
    2770861561,
    2716262478,
    3215044683,
    3143675388,
    3055782693,
    3001194130,
    2326604591,
    2389456536,
    2200899649,
    2280525302,
    2578013683,
    2640855108,
    2418763421,
    2498394922,
    3769900519,
    3832873040,
    3912640137,
    3992402750,
    4088425275,
    4151408268,
    4197601365,
    4277358050,
    3334271071,
    3263032808,
    3476998961,
    3422541446,
    3585640067,
    3514407732,
    3694837229,
    3640369242,
    1762451694,
    1842216281,
    1619975040,
    1682949687,
    2047383090,
    2127137669,
    1938468188,
    2001449195,
    1325665622,
    1271206113,
    1183200824,
    1111960463,
    1543535498,
    1489069629,
    1434599652,
    1363369299,
    622672798,
    568075817,
    748617968,
    677256519,
    907627842,
    853037301,
    1067152940,
    995781531,
    51762726,
    131386257,
    177728840,
    240578815,
    269590778,
    349224269,
    429104020,
    491947555,
    4046411278,
    4126034873,
    4172115296,
    4234965207,
    3794477266,
    3874110821,
    3953728444,
    4016571915,
    3609705398,
    3555108353,
    3735388376,
    3664026991,
    3290680682,
    3236090077,
    3449943556,
    3378572211,
    3174993278,
    3120533705,
    3032266256,
    2961025959,
    2923101090,
    2868635157,
    2813903052,
    2742672763,
    2604032198,
    2683796849,
    2461293480,
    2524268063,
    2284983834,
    2364738477,
    2175806836,
    2238787779,
    1569362073,
    1498123566,
    1409854455,
    1355396672,
    1317987909,
    1246755826,
    1192025387,
    1137557660,
    2072149281,
    2135122070,
    1912620623,
    1992383480,
    1753615357,
    1816598090,
    1627664531,
    1707420964,
    295390185,
    358241886,
    404320391,
    483945776,
    43990325,
    106832002,
    186451547,
    266083308,
    932423249,
    861060070,
    1041341759,
    986742920,
    613929101,
    542559546,
    756411363,
    701822548,
    3316196985,
    3244833742,
    3425377559,
    3370778784,
    3601682597,
    3530312978,
    3744426955,
    3689838204,
    3819031489,
    3881883254,
    3928223919,
    4007849240,
    4037393693,
    4100235434,
    4180117107,
    4259748804,
    2310601993,
    2373574846,
    2151335527,
    2231098320,
    2596047829,
    2659030626,
    2470359227,
    2550115596,
    2947551409,
    2876312838,
    2788305887,
    2733848168,
    3165939309,
    3094707162,
    3040238851,
    2985771188
  ]);
  var CRC322 = function() {
    var crc = 4294967295;
    this.getCRC = function() {
      return ~crc >>> 0;
    };
    this.updateCRC = function(value) {
      crc = crc << 8 ^ crc32Lookup[(crc >>> 24 ^ value) & 255];
    };
    this.updateCRCRun = function(value, count) {
      while (count-- > 0) {
        crc = crc << 8 ^ crc32Lookup[(crc >>> 24 ^ value) & 255];
      }
    };
  };
  return CRC322;
}();
var BitReader = bitreader;
var Stream2 = stream;
var CRC32 = crc32;
var MAX_HUFCODE_BITS = 20;
var MAX_SYMBOLS = 258;
var SYMBOL_RUNA = 0;
var SYMBOL_RUNB = 1;
var MIN_GROUPS = 2;
var MAX_GROUPS = 6;
var GROUP_SIZE = 50;
var WHOLEPI = "314159265359";
var SQRTPI = "177245385090";
var mtf = function(array, index2) {
  var src = array[index2], i;
  for (i = index2; i > 0; i--) {
    array[i] = array[i - 1];
  }
  array[0] = src;
  return src;
};
var Err = {
  OK: 0,
  LAST_BLOCK: -1,
  NOT_BZIP_DATA: -2,
  UNEXPECTED_INPUT_EOF: -3,
  UNEXPECTED_OUTPUT_EOF: -4,
  DATA_ERROR: -5,
  OUT_OF_MEMORY: -6,
  OBSOLETE_INPUT: -7,
  END_OF_BLOCK: -8
};
var ErrorMessages = {};
ErrorMessages[Err.LAST_BLOCK] = "Bad file checksum";
ErrorMessages[Err.NOT_BZIP_DATA] = "Not bzip data";
ErrorMessages[Err.UNEXPECTED_INPUT_EOF] = "Unexpected input EOF";
ErrorMessages[Err.UNEXPECTED_OUTPUT_EOF] = "Unexpected output EOF";
ErrorMessages[Err.DATA_ERROR] = "Data error";
ErrorMessages[Err.OUT_OF_MEMORY] = "Out of memory";
ErrorMessages[Err.OBSOLETE_INPUT] = "Obsolete (pre 0.9.5) bzip format not supported.";
var _throw = function(status, optDetail) {
  var msg = ErrorMessages[status] || "unknown error";
  if (optDetail) {
    msg += ": " + optDetail;
  }
  var e = new TypeError(msg);
  e.errorCode = status;
  throw e;
};
var Bunzip = function(inputStream, outputStream) {
  this.writePos = this.writeCurrent = this.writeCount = 0;
  this._start_bunzip(inputStream, outputStream);
};
Bunzip.prototype._init_block = function() {
  var moreBlocks = this._get_next_block();
  if (!moreBlocks) {
    this.writeCount = -1;
    return false;
  }
  this.blockCRC = new CRC32();
  return true;
};
Bunzip.prototype._start_bunzip = function(inputStream, outputStream) {
  var buf = new Uint8Array(4);
  if (inputStream.read(buf, 0, 4) !== 4 || String.fromCharCode(buf[0], buf[1], buf[2]) !== "BZh")
    _throw(Err.NOT_BZIP_DATA, "bad magic");
  var level = buf[3] - 48;
  if (level < 1 || level > 9)
    _throw(Err.NOT_BZIP_DATA, "level out of range");
  this.reader = new BitReader(inputStream);
  this.dbufSize = 1e5 * level;
  this.nextoutput = 0;
  this.outputStream = outputStream;
  this.streamCRC = 0;
};
Bunzip.prototype._get_next_block = function() {
  var i, j, k;
  var reader = this.reader;
  var h = reader.pi();
  if (h === SQRTPI) {
    return false;
  }
  if (h !== WHOLEPI)
    _throw(Err.NOT_BZIP_DATA);
  this.targetBlockCRC = reader.read(32) >>> 0;
  this.streamCRC = (this.targetBlockCRC ^ (this.streamCRC << 1 | this.streamCRC >>> 31)) >>> 0;
  if (reader.read(1))
    _throw(Err.OBSOLETE_INPUT);
  var origPointer = reader.read(24);
  if (origPointer > this.dbufSize)
    _throw(Err.DATA_ERROR, "initial position out of bounds");
  var t = reader.read(16);
  var symToByte = new Uint8Array(256), symTotal = 0;
  for (i = 0; i < 16; i++) {
    if (t & 1 << 15 - i) {
      var o = i * 16;
      k = reader.read(16);
      for (j = 0; j < 16; j++)
        if (k & 1 << 15 - j)
          symToByte[symTotal++] = o + j;
    }
  }
  var groupCount = reader.read(3);
  if (groupCount < MIN_GROUPS || groupCount > MAX_GROUPS)
    _throw(Err.DATA_ERROR);
  var nSelectors = reader.read(15);
  if (nSelectors === 0)
    _throw(Err.DATA_ERROR);
  var mtfSymbol = new Uint8Array(256);
  for (i = 0; i < groupCount; i++)
    mtfSymbol[i] = i;
  var selectors = new Uint8Array(nSelectors);
  for (i = 0; i < nSelectors; i++) {
    for (j = 0; reader.read(1); j++)
      if (j >= groupCount) _throw(Err.DATA_ERROR);
    selectors[i] = mtf(mtfSymbol, j);
  }
  var symCount = symTotal + 2;
  var groups = [], hufGroup;
  for (j = 0; j < groupCount; j++) {
    var length = new Uint8Array(symCount), temp = new Uint16Array(MAX_HUFCODE_BITS + 1);
    t = reader.read(5);
    for (i = 0; i < symCount; i++) {
      for (; ; ) {
        if (t < 1 || t > MAX_HUFCODE_BITS) _throw(Err.DATA_ERROR);
        if (!reader.read(1))
          break;
        if (!reader.read(1))
          t++;
        else
          t--;
      }
      length[i] = t;
    }
    var minLen, maxLen;
    minLen = maxLen = length[0];
    for (i = 1; i < symCount; i++) {
      if (length[i] > maxLen)
        maxLen = length[i];
      else if (length[i] < minLen)
        minLen = length[i];
    }
    hufGroup = {};
    groups.push(hufGroup);
    hufGroup.permute = new Uint16Array(MAX_SYMBOLS);
    hufGroup.limit = new Uint32Array(MAX_HUFCODE_BITS + 2);
    hufGroup.base = new Uint32Array(MAX_HUFCODE_BITS + 1);
    hufGroup.minLen = minLen;
    hufGroup.maxLen = maxLen;
    var pp = 0;
    for (i = minLen; i <= maxLen; i++) {
      temp[i] = hufGroup.limit[i] = 0;
      for (t = 0; t < symCount; t++)
        if (length[t] === i)
          hufGroup.permute[pp++] = t;
    }
    for (i = 0; i < symCount; i++)
      temp[length[i]]++;
    pp = t = 0;
    for (i = minLen; i < maxLen; i++) {
      pp += temp[i];
      hufGroup.limit[i] = pp - 1;
      pp <<= 1;
      t += temp[i];
      hufGroup.base[i + 1] = pp - t;
    }
    hufGroup.limit[maxLen + 1] = Number.MAX_VALUE;
    hufGroup.limit[maxLen] = pp + temp[maxLen] - 1;
    hufGroup.base[minLen] = 0;
  }
  var byteCount = new Uint32Array(256);
  for (i = 0; i < 256; i++)
    mtfSymbol[i] = i;
  var runPos = 0, dbufCount = 0, selector = 0, uc;
  var dbuf = this.dbuf = new Uint32Array(this.dbufSize);
  symCount = 0;
  for (; ; ) {
    if (!symCount--) {
      symCount = GROUP_SIZE - 1;
      if (selector >= nSelectors) {
        _throw(Err.DATA_ERROR);
      }
      hufGroup = groups[selectors[selector++]];
    }
    i = hufGroup.minLen;
    j = reader.read(i);
    for (; ; i++) {
      if (i > hufGroup.maxLen) {
        _throw(Err.DATA_ERROR);
      }
      if (j <= hufGroup.limit[i])
        break;
      j = j << 1 | reader.read(1);
    }
    j -= hufGroup.base[i];
    if (j < 0 || j >= MAX_SYMBOLS) {
      _throw(Err.DATA_ERROR);
    }
    var nextSym = hufGroup.permute[j];
    if (nextSym === SYMBOL_RUNA || nextSym === SYMBOL_RUNB) {
      if (!runPos) {
        runPos = 1;
        t = 0;
      }
      if (nextSym === SYMBOL_RUNA)
        t += runPos;
      else
        t += 2 * runPos;
      runPos <<= 1;
      continue;
    }
    if (runPos) {
      runPos = 0;
      if (dbufCount + t > this.dbufSize) {
        _throw(Err.DATA_ERROR);
      }
      uc = symToByte[mtfSymbol[0]];
      byteCount[uc] += t;
      while (t--)
        dbuf[dbufCount++] = uc;
    }
    if (nextSym > symTotal)
      break;
    if (dbufCount >= this.dbufSize) {
      _throw(Err.DATA_ERROR);
    }
    i = nextSym - 1;
    uc = mtf(mtfSymbol, i);
    uc = symToByte[uc];
    byteCount[uc]++;
    dbuf[dbufCount++] = uc;
  }
  if (origPointer < 0 || origPointer >= dbufCount) {
    _throw(Err.DATA_ERROR);
  }
  j = 0;
  for (i = 0; i < 256; i++) {
    k = j + byteCount[i];
    byteCount[i] = j;
    j = k;
  }
  for (i = 0; i < dbufCount; i++) {
    uc = dbuf[i] & 255;
    dbuf[byteCount[uc]] |= i << 8;
    byteCount[uc]++;
  }
  var pos2 = 0, current = 0, run2 = 0;
  if (dbufCount) {
    pos2 = dbuf[origPointer];
    current = pos2 & 255;
    pos2 >>= 8;
    run2 = -1;
  }
  this.writePos = pos2;
  this.writeCurrent = current;
  this.writeCount = dbufCount;
  this.writeRun = run2;
  return true;
};
Bunzip.prototype._read_bunzip = function(outputBuffer, len) {
  var copies, previous, outbyte;
  if (this.writeCount < 0) {
    return 0;
  }
  var dbuf = this.dbuf, pos2 = this.writePos, current = this.writeCurrent;
  var dbufCount = this.writeCount;
  this.outputsize;
  var run2 = this.writeRun;
  while (dbufCount) {
    dbufCount--;
    previous = current;
    pos2 = dbuf[pos2];
    current = pos2 & 255;
    pos2 >>= 8;
    if (run2++ === 3) {
      copies = current;
      outbyte = previous;
      current = -1;
    } else {
      copies = 1;
      outbyte = current;
    }
    this.blockCRC.updateCRCRun(outbyte, copies);
    while (copies--) {
      this.outputStream.writeByte(outbyte);
      this.nextoutput++;
    }
    if (current != previous)
      run2 = 0;
  }
  this.writeCount = dbufCount;
  if (this.blockCRC.getCRC() !== this.targetBlockCRC) {
    _throw(Err.DATA_ERROR, "Bad block CRC (got " + this.blockCRC.getCRC().toString(16) + " expected " + this.targetBlockCRC.toString(16) + ")");
  }
  return this.nextoutput;
};
var coerceInputStream = function(input) {
  if ("readByte" in input) {
    return input;
  }
  var inputStream = new Stream2();
  inputStream.pos = 0;
  inputStream.readByte = function() {
    return input[this.pos++];
  };
  inputStream.seek = function(pos2) {
    this.pos = pos2;
  };
  inputStream.eof = function() {
    return this.pos >= input.length;
  };
  return inputStream;
};
var coerceOutputStream = function(output2) {
  var outputStream = new Stream2();
  var resizeOk = true;
  if (output2) {
    if (typeof output2 === "number") {
      outputStream.buffer = new Uint8Array(output2);
      resizeOk = false;
    } else if ("writeByte" in output2) {
      return output2;
    } else {
      outputStream.buffer = output2;
      resizeOk = false;
    }
  } else {
    outputStream.buffer = new Uint8Array(16384);
  }
  outputStream.pos = 0;
  outputStream.writeByte = function(_byte) {
    if (resizeOk && this.pos >= this.buffer.length) {
      var newBuffer = new Uint8Array(this.buffer.length * 2);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
    this.buffer[this.pos++] = _byte;
  };
  outputStream.getBuffer = function() {
    if (this.pos !== this.buffer.length) {
      if (!resizeOk)
        throw new TypeError("outputsize does not match decoded input");
      var newBuffer = new Uint8Array(this.pos);
      newBuffer.set(this.buffer.subarray(0, this.pos));
      this.buffer = newBuffer;
    }
    return this.buffer;
  };
  outputStream._coerced = true;
  return outputStream;
};
var decode2 = function(input, output2, multistream) {
  var inputStream = coerceInputStream(input);
  var outputStream = coerceOutputStream(output2);
  var bz = new Bunzip(inputStream, outputStream);
  while (true) {
    if ("eof" in inputStream && inputStream.eof()) break;
    if (bz._init_block()) {
      bz._read_bunzip();
    } else {
      var targetStreamCRC = bz.reader.read(32) >>> 0;
      if (targetStreamCRC !== bz.streamCRC) {
        _throw(Err.DATA_ERROR, "Bad stream CRC (got " + bz.streamCRC.toString(16) + " expected " + targetStreamCRC.toString(16) + ")");
      }
      if (multistream && "eof" in inputStream && !inputStream.eof()) {
        bz._start_bunzip(inputStream, outputStream);
      } else break;
    }
  }
  if ("getBuffer" in outputStream)
    return outputStream.getBuffer();
};
var decodeBlock = function(input, pos2, output2) {
  var inputStream = coerceInputStream(input);
  var outputStream = coerceOutputStream(output2);
  var bz = new Bunzip(inputStream, outputStream);
  bz.reader.seek(pos2);
  var moreBlocks = bz._get_next_block();
  if (moreBlocks) {
    bz.blockCRC = new CRC32();
    bz.writeCopies = 0;
    bz._read_bunzip();
  }
  if ("getBuffer" in outputStream)
    return outputStream.getBuffer();
};
var table = function(input, callback, multistream) {
  var inputStream = new Stream2();
  inputStream.delegate = coerceInputStream(input);
  inputStream.pos = 0;
  inputStream.readByte = function() {
    this.pos++;
    return this.delegate.readByte();
  };
  if (inputStream.delegate.eof) {
    inputStream.eof = inputStream.delegate.eof.bind(inputStream.delegate);
  }
  var outputStream = new Stream2();
  outputStream.pos = 0;
  outputStream.writeByte = function() {
    this.pos++;
  };
  var bz = new Bunzip(inputStream, outputStream);
  var blockSize = bz.dbufSize;
  while (true) {
    if ("eof" in inputStream && inputStream.eof()) break;
    var position = inputStream.pos * 8 + bz.reader.bitOffset;
    if (bz.reader.hasByte) {
      position -= 8;
    }
    if (bz._init_block()) {
      var start = outputStream.pos;
      bz._read_bunzip();
      callback(position, outputStream.pos - start);
    } else {
      bz.reader.read(32);
      if (multistream && "eof" in inputStream && !inputStream.eof()) {
        bz._start_bunzip(inputStream, outputStream);
        console.assert(
          bz.dbufSize === blockSize,
          "shouldn't change block size within multistream file"
        );
      } else break;
    }
  }
};
var lib = {
  Bunzip,
  Stream: Stream2,
  Err,
  decode: decode2,
  decodeBlock,
  table
};
var index = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null
}, [lib]);

// publickey.asc
var publickey_default = "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBGgLF9oBEACxDD5JMI7mMt5q7qjhMLfmZT8jhrgmyx88uiVVXxrREFPanGKE\nP/EzVAxV3kRBbT1zWxJHYr4bT5vL+tVMWc1w1dsm+n1FD8FOmo14aBFjdLlTs1o/\nsFmUL9YZGtFPzcszuEVFjUKQybyWBm95yrq2+1v/r0Rh2lC715ZrgGuzs9ekZad1\nCES+CDhr+TFCfB4pOV8ECmvLANx1l2RaoTN8Kcin8124/19f42uKzVT/uOyCsf/9\nJLEuxrUYQxoJWIv2BtJp+91lUK6/HQqkJy8WPqXEGxAWxceCqheyaU8t8XHQhJ3o\nai9r9V3wE+OxOLjyzbjuCx3Tn5OGixv2gAU8Gaks8NI+jCL6euM0W4RIo1xsH2Gu\nNyx1Qv0PYTRqz7+dbS+yZ/2JnCCQlwDRmBTAw8P+KUPFHi81P9ehOIg7WNPxjlph\nbRM185D/sAjN7iha2HwQXmKJ3DKR+JNXxREYaVrTBGKtcN+LQIOxMbHkAW6rSCwt\nv521aGIpzDpBST6glxcHGgGo8Z4802l9sYBW74Qr2ZsI6Oh2mlkb65kNvc916yLp\nhgXHtZrdHWhfab6l1RUPqkuz6ZyWrZUQvpNpTfMTSA9Dl2xS2iALBhg6n4h7lIhY\nCKAFXB3RPbWcA6++dVndV0wLpw602CCbLcUjB+4VCkldaRg2jSmascrUdwARAQAB\ntDVMZWEgQ2hhaW4gKFJlbGVhc2UgU2lnbmluZyBLZXkpIDxyZWxlYXNlc0BnZXRs\nZWEub3JnPokCVAQTAQoAPhYhBK1wB1vBTqa5W3ulJhjZgCAdEyiGBQJoCxfaAhsD\nBQkFo5qABQsJCAcCBhUKCQgLAgQWAgMBAh4BAheAAAoJEBjZgCAdEyiGOrIP/1n8\ntFFJyKRb1g+xHRBpkst7YUtlmf0egmrOgkQdRqz45Z5CrwQt2MhbvC6DTVSpTNQb\nI+Itb/aTTWJvJdqFi0nOMQzqAF4WSjsa8cW8Rvw4z4YuiTBX1VWrV8iCTZHS1meL\n1T22/oxeOMX4fMGr8nNb2pPQAmnlB3TLtOPo+PyUVVM6JZyD8y/UznZS/owmHY0h\nCbYLMhBnPrY5qQDP6DqeCXda6MnDb5W9xNmyCobU4vGQp0pux3wJDIOUs0oyamNR\nCipXedsyz4Ybiz/VNFXW10X181vpdvWe7GMePDxqNS6I/t1eD55NCCkbuVUc/JE5\nDCmeoyxJYUv/TgFUqQMNeJKmCFc+rANTu9bDT7o4sOfx7Jju1RIKsogBa+KmEbFZ\nBbYp+PzHr5LPoYxfII2tjBj9NiwOg4KYiOGWcYdPxCKtuu1uCBdkEbhJKP8IUGum\nM2ga3s3oIqPGV7sKUVcdOghCKtUcz5nWXgfSsaKurd0oisj+wic5QivvXOlSr2iY\nhKrUiAA/q4iJR/hAemh5KBK/EvyEYaITlH6aaR5cwkRRmVV4ZLwxNzhVze43GJ/7\n81h0Pyh86D7mS2AsBnOAlDToEeil+mZWVwuEcvHGlbHDjmuFwbKsY8zeJYt0u5cl\nvrt59waMdOT/PdTEwp6pUE3XidS2lYnMuyX9i/De\n=cnXS\n-----END PGP PUBLIC KEY BLOCK-----\n";

// cli.js
var USER_AGENT = "lea-release-loader";
async function cleanupFile(filePath) {
  try {
    if (filePath && fs11.existsSync(filePath)) {
      await fs11.promises.unlink(filePath);
    }
  } catch (cleanupErr) {
    if (cleanupErr.code !== "ENOENT") {
      console.warn(`Failed to delete temporary file (${filePath}): ${cleanupErr.message}`);
    }
  }
}
async function download(url, dest, userAgent) {
  let fileStream;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent },
      redirect: "follow"
    });
    if (!response.ok) {
      let errorDetails = "";
      try {
        errorDetails = await response.text();
      } catch (_error) {
      }
      throw new Error(
        `Download failed: HTTP ${response.status} ${response.statusText} from ${url}${errorDetails ? `
Response: ${errorDetails.substring(0, 200)}` : ""}`
      );
    }
    if (!response.body) {
      throw new Error(`Response body is missing for ${url}`);
    }
    fileStream = fs11.createWriteStream(dest);
    await pipeline(response.body, fileStream);
  } catch (error) {
    if (fileStream && !fileStream.closed) {
      await new Promise((resolve2) => fileStream.close(resolve2));
    }
    throw error;
  }
}
async function verifySignature(signatureFilePath, dataFilePath, publicKeyArmored) {
  console.log(`Verifying PGP signature: ${path8.basename(signatureFilePath)} for ${path8.basename(dataFilePath)}`);
  try {
    const signatureArmored = await fs11.promises.readFile(signatureFilePath, "utf8");
    const signature = await readSignature({ armoredSignature: signatureArmored });
    const dataBuffer = await fs11.promises.readFile(dataFilePath);
    const messageToVerify = await createMessage({ binary: dataBuffer });
    const verificationKey = await readKey({ armoredKey: publicKeyArmored });
    const verificationResult = await verify({
      signature,
      message: messageToVerify,
      verificationKeys: verificationKey
    });
    const verifiedSignature = verificationResult.signatures.find((sig) => sig.verified);
    if (verifiedSignature && await verifiedSignature.verified) {
      const keyId = verifiedSignature.keyID.toHex().toUpperCase();
      console.log(`PGP signature verification successful. Signed by key ID ${keyId}.`);
    } else {
      const firstSignature = verificationResult.signatures[0];
      let errMsg = "PGP signature verification failed: ";
      if (firstSignature) {
        const keyId = firstSignature.keyID.toHex().toUpperCase();
        errMsg += `Signature found (Key ID: ${keyId}) but could not be verified.`;
      } else {
        errMsg += "No valid signature structure found in the .asc file.";
      }
      errMsg += " Ensure the embedded public key corresponds to the signature and the data file has not been corrupted.";
      throw new Error(errMsg);
    }
  } catch (error) {
    console.error("Error during PGP verification:", error.message);
    let specificError = error.message;
    if (error.message.includes("readKey")) {
      specificError = `Could not read imported public key. Ensure the publickey.asc file is correct and build process worked. Original error: ${error.message}`;
    }
    throw new Error(`PGP verification failed: ${specificError}`);
  }
}
async function run() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: npx lea-rl <releaseFileUrl> <destinationDir>

Arguments:
  releaseFileUrl    Full URL of the release artifact (e.g., .tar.gz file).
                    The signature file URL will be derived by appending '.asc'.
  destinationDir    Local directory to extract the release files into.

Example:
  npx lea-rl https://example.getlea.org/releases/v1.0.0/data.tar.gz ./output-folder

`);
    process.exit(args.includes("--help") || args.includes("-h") ? 0 : 1);
  }
  const [releaseFileUrl, destinationDir] = args;
  try {
    new URL(releaseFileUrl);
  } catch (e) {
    console.error(`Error: Invalid URL provided - ${e.message}`);
    process.exit(1);
  }
  const signatureFileUrl = `${releaseFileUrl}.asc`;
  console.log(`Derived Signature File URL: ${signatureFileUrl}`);
  const extractDir = path8.resolve(process.cwd(), destinationDir);
  const TEMP_DIR = os.tmpdir();
  const RANDOM_ID = crypto2.randomUUID();
  const tempTargzFilename = `download-${RANDOM_ID}-${path8.basename(new URL(releaseFileUrl).pathname) || "release"}`;
  const tempAscFilename = `download-${RANDOM_ID}-${path8.basename(new URL(signatureFileUrl).pathname) || "signature"}.asc`;
  const TEMP_FILE_TARGZ = path8.join(TEMP_DIR, tempTargzFilename);
  const TEMP_FILE_ASC = path8.join(TEMP_DIR, tempAscFilename);
  let targzDownloaded = false;
  let ascDownloaded = false;
  console.log(`Release File URL: ${releaseFileUrl}`);
  console.log(`Target directory: ${extractDir}`);
  try {
    console.log(`Downloading release file...`);
    await download(releaseFileUrl, TEMP_FILE_TARGZ, USER_AGENT);
    targzDownloaded = true;
    console.log(`Downloading signature file...`);
    await download(signatureFileUrl, TEMP_FILE_ASC, USER_AGENT);
    ascDownloaded = true;
    await verifySignature(TEMP_FILE_ASC, TEMP_FILE_TARGZ, publickey_default);
    console.log(`Ensuring extraction directory exists: ${extractDir}`);
    await fs11.promises.mkdir(extractDir, { recursive: true });
    console.log(`Extracting ${path8.basename(TEMP_FILE_TARGZ)} to ${extractDir}...`);
    await extract({
      file: TEMP_FILE_TARGZ,
      cwd: extractDir,
      strip: 0
    });
    console.log(`Files extracted to ${extractDir}`);
  } catch (err2) {
    console.error("failed:", err2.message);
    process.exitCode = 1;
  } finally {
    if (targzDownloaded) {
      await cleanupFile(TEMP_FILE_TARGZ);
    }
    if (ascDownloaded) {
      await cleanupFile(TEMP_FILE_ASC);
    }
    process.exit(process.exitCode || 0);
  }
}
run();
/*! Bundled license information:

openpgp/dist/node/openpgp.mjs:
  (*! OpenPGP.js v6.1.0 - 2025-01-30 - this is LGPL licensed code, see LICENSE/our website https://openpgpjs.org/ for more information. *)
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)

openpgp/dist/node/openpgp.mjs:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
