/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API Key - Create one at https://dash.userplane.io/_/account?tab=developers */
  "apiKey": string,
  /** API Host - API host for self-hosted or staging deployments. Accepts any form: api-dev.userplane.io or https://api-dev.userplane.io. */
  "apiBaseUrl": string,
  /** Dashboard Host - Dashboard host for self-hosted or staging deployments. Accepts any form: dash-dev.userplane.io or https://dash-dev.userplane.io. */
  "dashBaseUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `create-link` command */
  export type CreateLink = ExtensionPreferences & {}
  /** Preferences accessible in the `list-recordings` command */
  export type ListRecordings = ExtensionPreferences & {}
  /** Preferences accessible in the `list-links` command */
  export type ListLinks = ExtensionPreferences & {}
  /** Preferences accessible in the `menu-bar` command */
  export type MenuBar = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `create-link` command */
  export type CreateLink = {}
  /** Arguments passed to the `list-recordings` command */
  export type ListRecordings = {}
  /** Arguments passed to the `list-links` command */
  export type ListLinks = {}
  /** Arguments passed to the `menu-bar` command */
  export type MenuBar = {}
}

