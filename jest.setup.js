// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills para Next.js no ambiente de testes
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, TransformStream } from 'stream/web'

// Polyfills básicos
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfills para APIs Web
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor() {}
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor() {}
  }
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream
}

