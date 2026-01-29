/**
 * Intercom Canvas Kit Types
 * Types for Intercom Inbox and Messenger app integration
 * @see https://developers.intercom.com/docs/canvas-kit
 */

/**
 * Intercom admin (teammate) context object
 * @see https://developers.intercom.com/docs/canvas-kit#admin
 */
export interface IntercomAdmin {
  type: 'admin';
  id: string;
  name: string;
  email: string;
  job_title?: string;
  away_mode_enabled?: boolean;
  away_mode_reassign?: boolean;
  avatar?: {
    image_url?: string;
  };
  team_ids?: number[];
}

/**
 * Intercom user (customer) context object
 */
export interface IntercomUser {
  id: string;
  email?: string;
  name?: string;
  type: 'user' | 'lead';
}

/**
 * Intercom conversation context
 */
export interface IntercomConversation {
  id: string;
  custom_attributes?: Record<string, unknown>;
}

/**
 * Messenger context location types
 * @see https://developers.intercom.com/docs/canvas-kit#context
 */
export type MessengerLocation = 'conversation' | 'home' | 'message';

/**
 * Inbox context location type
 */
export type InboxLocation = 'inbox';

/**
 * Combined location type for all contexts
 */
export type CanvasLocation = MessengerLocation | InboxLocation;

/**
 * Base context fields shared across all contexts
 */
interface BaseCanvasContext {
  locale?: string;
}

/**
 * Messenger context - sent when app is rendered in Messenger
 */
export interface MessengerCanvasContext extends BaseCanvasContext {
  location: MessengerLocation;
  conversation_id?: number; // Only present if location === 'conversation'
  messenger_action_color?: string;
  messenger_background_color?: string;
  referrer?: string;
}

/**
 * Inbox context - sent when app is rendered in Inbox sidebar
 */
export interface InboxCanvasContext extends BaseCanvasContext {
  location: InboxLocation;
  conversation_id?: number;
}

/**
 * Union type for all canvas contexts
 */
export type CanvasContext = MessengerCanvasContext | InboxCanvasContext;

/**
 * Card creation options for inserting a card into conversation
 */
export interface CardCreationOptions {
  link_url?: string;
  link_title?: string;
  custom_message?: string;
  footer?: string | null;
}

/**
 * Input values from form submissions
 */
export interface CanvasInputValues {
  [componentId: string]: string | string[] | undefined;
}

/**
 * Initialize request from Intercom Canvas Kit
 * Called when card is being added or messenger app is opened
 * @see https://developers.intercom.com/docs/canvas-kit#initialize-flow
 */
export interface IntercomCanvasInitializeRequest {
  workspace_id: string;
  admin?: IntercomAdmin; // Present for inbox context
  user?: IntercomUser; // Present for messenger context
  conversation?: IntercomConversation;
  context?: CanvasContext;
  card_creation_options?: CardCreationOptions;
  current_canvas?: {
    content_url?: string;
    stored_data?: Record<string, unknown>;
  };
}

/**
 * Configure request from Intercom Canvas Kit
 * Used for card creation flow to configure the card before sending
 * Can be called multiple times as teammate interacts with configuration UI
 * @see https://developers.intercom.com/docs/canvas-kit#configure-flow
 */
export interface IntercomCanvasConfigureRequest {
  workspace_id: string;
  admin: IntercomAdmin;
  context?: InboxCanvasContext;
  // Present in subsequent configure requests (after first request)
  current_canvas?: {
    content: CanvasContent;
    stored_data?: Record<string, unknown>;
  };
  component_id?: string; // ID of component that triggered the action
  input_values?: CanvasInputValues; // Values entered in form components
}

/**
 * Submit request from Intercom Canvas Kit
 * Called when user/admin interacts with a canvas component (button click, form submit)
 * @see https://developers.intercom.com/docs/canvas-kit#submit-flow
 */
export interface IntercomCanvasSubmitRequest {
  workspace_id: string;
  component_id: string; // ID of component that triggered the action
  context?: CanvasContext;
  current_canvas?: {
    content: CanvasContent;
    stored_data?: Record<string, unknown>;
  };
  input_values?: CanvasInputValues;
  // For Inbox context (teammate)
  admin?: IntercomAdmin;
  // For Messenger context (customer)
  user?: IntercomUser;
  conversation?: IntercomConversation;
}

/**
 * Canvas component types
 */
export type CanvasComponentType =
  | 'text'
  | 'button'
  | 'dropdown'
  | 'input'
  | 'spacer'
  | 'divider'
  | 'image'
  | 'list';

/**
 * Text style options
 */
export type TextStyle = 'header' | 'paragraph' | 'muted' | 'error';

/**
 * Button style options
 */
export type ButtonStyle = 'primary' | 'secondary' | 'link';

/**
 * Button action types
 */
export interface ButtonSubmitAction {
  type: 'submit';
}

export interface ButtonUrlAction {
  type: 'url';
  url: string;
}

export interface ButtonSheetAction {
  type: 'sheet';
  url: string;
}

export type ButtonAction = ButtonSubmitAction | ButtonUrlAction | ButtonSheetAction;

/**
 * Dropdown option
 */
export interface DropdownOption {
  type: 'option';
  id: string;
  text: string;
  disabled?: boolean;
}

/**
 * Canvas component definitions
 */
export interface TextComponent {
  type: 'text';
  id: string;
  text: string;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
}

export interface ButtonComponent {
  type: 'button';
  id: string;
  label: string;
  style?: ButtonStyle;
  action: ButtonAction;
  disabled?: boolean;
}

export interface DropdownComponent {
  type: 'dropdown';
  id: string;
  label?: string;
  options: DropdownOption[];
  value?: string;
  disabled?: boolean;
  save_state?: 'unsaved' | 'saved' | 'failed';
}

export interface InputComponent {
  type: 'input';
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  save_state?: 'unsaved' | 'saved' | 'failed';
}

export interface SpacerComponent {
  type: 'spacer';
  size: 'xs' | 's' | 'm' | 'l' | 'xl';
}

export interface DividerComponent {
  type: 'divider';
}

export interface ImageComponent {
  type: 'image';
  id: string;
  url: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ListItem {
  type: 'item';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  image_width?: number;
  image_height?: number;
  action?: ButtonAction;
  disabled?: boolean;
}

export interface ListComponent {
  type: 'list';
  id?: string;
  items: ListItem[];
  disabled?: boolean;
}

export type CanvasComponent =
  | TextComponent
  | ButtonComponent
  | DropdownComponent
  | InputComponent
  | SpacerComponent
  | DividerComponent
  | ImageComponent
  | ListComponent;

/**
 * Canvas content structure
 */
export interface CanvasContent {
  components: CanvasComponent[];
}

/**
 * Canvas response object
 */
export interface Canvas {
  content: CanvasContent;
  stored_data?: Record<string, unknown>;
}

/**
 * Full canvas response
 */
export interface CanvasResponse {
  canvas: Canvas;
  card_creation_options?: CardCreationOptions;
}

/**
 * Configure response for completing card creation flow
 * Results become card_creation_options in the initialize flow
 * @see https://developers.intercom.com/docs/canvas-kit#configure-flow
 */
export interface ConfigureResponse {
  results: CardCreationOptions;
}
