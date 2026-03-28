/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: any): any;
  }
}
