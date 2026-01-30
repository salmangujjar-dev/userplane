/**
 * Intercom Canvas Kit Types
 *
 * Zod schemas for type-safe Intercom Canvas Kit integration.
 * Types are derived from schemas for runtime validation and compile-time safety.
 *
 * @see https://developers.intercom.com/docs/canvas-kit
 */

import { z } from 'zod';

// =============================================================================
// Intercom Entity Schemas
// =============================================================================

/**
 * Intercom admin (teammate) - the person using the Inbox app
 * We call them "teammate" in our domain, Intercom calls them "admin"
 */
export const IntercomTeammateSchema = z.object({
  type: z.literal('admin'),
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  job_title: z.string().optional(),
  away_mode_enabled: z.boolean().optional(),
  away_mode_reassign: z.boolean().optional(),
  avatar: z
    .object({
      image_url: z.string().optional(),
    })
    .optional(),
  team_ids: z.array(z.number()).optional(),
});

/**
 * Intercom user (customer/lead) - the person receiving the card
 */
export const IntercomCustomerSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(['user', 'lead']),
});

/**
 * Intercom conversation context
 */
export const IntercomConversationSchema = z.object({
  id: z.string(),
  custom_attributes: z.record(z.unknown()).optional(),
});

// =============================================================================
// Context Schemas
// =============================================================================

/**
 * Messenger location types (customer-facing)
 */
export const MessengerLocationSchema = z.enum(['conversation', 'home', 'message']);

/**
 * Inbox location type (teammate-facing)
 */
export const InboxLocationSchema = z.literal('inbox');

/**
 * Base context fields shared across all contexts
 */
const BaseCanvasContextSchema = z.object({
  locale: z.string().optional(),
});

/**
 * Messenger context - sent when app is rendered in Messenger
 */
export const MessengerCanvasContextSchema = BaseCanvasContextSchema.extend({
  location: MessengerLocationSchema,
  conversation_id: z.number().optional(),
  messenger_action_color: z.string().optional(),
  messenger_background_color: z.string().optional(),
  referrer: z.string().optional(),
});

/**
 * Inbox context - sent when app is rendered in Inbox sidebar
 */
export const InboxCanvasContextSchema = BaseCanvasContextSchema.extend({
  location: InboxLocationSchema,
  conversation_id: z.number().optional(),
});

/**
 * Union type for all canvas contexts
 */
export const CanvasContextSchema = z.union([
  MessengerCanvasContextSchema,
  InboxCanvasContextSchema,
]);

// =============================================================================
// Card Creation Options Schema
// =============================================================================

/**
 * Card creation options for inserting a card into conversation
 * These are set during configure flow and passed to initialize flow
 */
export const CardCreationOptionsSchema = z.object({
  link_url: z.string().optional(),
  link_title: z.string().optional(),
  custom_message: z.string().optional(),
  footer: z.string().nullable().optional(),
});

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Input values from form submissions
 */
export const CanvasInputValuesSchema = z.record(
  z.union([z.string(), z.array(z.string()), z.undefined()])
);

/**
 * Current canvas state (for subsequent requests)
 */
export const CurrentCanvasSchema = z.object({
  content_url: z.string().optional(),
  content: z.any().optional(), // Canvas content - complex nested structure
  stored_data: z.record(z.unknown()).optional(),
});

/**
 * Messenger Initialize Request
 * Called when customer opens a card in Messenger
 */
export const MessengerInitializeRequestSchema = z.object({
  workspace_id: z.string(),
  card_creation_options: CardCreationOptionsSchema,
  user: IntercomCustomerSchema.optional(),
  conversation: IntercomConversationSchema.optional(),
  context: MessengerCanvasContextSchema.optional(),
  current_canvas: CurrentCanvasSchema.optional(),
});

/**
 * Inbox Initialize Request
 * Called when teammate opens app in Inbox sidebar
 */
export const InboxInitializeRequestSchema = z.object({
  workspace_id: z.string(),
  admin: IntercomTeammateSchema,
  conversation: IntercomConversationSchema.optional(),
  context: InboxCanvasContextSchema.optional(),
  current_canvas: CurrentCanvasSchema.optional(),
});

/**
 * Combined Initialize Request (for raw Intercom webhook)
 * Use MessengerInitializeRequestSchema or InboxInitializeRequestSchema for typed handling
 */
export const IntercomCanvasInitializeRequestSchema = z.object({
  workspace_id: z.string(),
  admin: IntercomTeammateSchema.optional(),
  user: IntercomCustomerSchema.optional(),
  conversation: IntercomConversationSchema.optional(),
  context: CanvasContextSchema.optional(),
  card_creation_options: CardCreationOptionsSchema.optional(),
  current_canvas: CurrentCanvasSchema.optional(),
});

/**
 * Configure Request
 * Used for card creation flow to configure the card before sending
 */
export const IntercomCanvasConfigureRequestSchema = z.object({
  workspace_id: z.string(),
  admin: IntercomTeammateSchema,
  context: InboxCanvasContextSchema.optional(),
  current_canvas: CurrentCanvasSchema.optional(),
  component_id: z.string().optional(),
  input_values: CanvasInputValuesSchema.optional(),
});

/**
 * Submit Request
 * Called when user/teammate interacts with a canvas component
 */
export const IntercomCanvasSubmitRequestSchema = z.object({
  workspace_id: z.string(),
  component_id: z.string(),
  context: CanvasContextSchema.optional(),
  current_canvas: CurrentCanvasSchema.optional(),
  input_values: CanvasInputValuesSchema.optional(),
  admin: IntercomTeammateSchema.optional(),
  user: IntercomCustomerSchema.optional(),
  conversation: IntercomConversationSchema.optional(),
});

// =============================================================================
// Component Types (for Canvas Response)
// =============================================================================

export const TextStyleSchema = z.enum(['header', 'paragraph', 'muted', 'error']);
export const ButtonStyleSchema = z.enum(['primary', 'secondary', 'link']);

export const ButtonSubmitActionSchema = z.object({ type: z.literal('submit') });
export const ButtonUrlActionSchema = z.object({ type: z.literal('url'), url: z.string() });
export const ButtonSheetActionSchema = z.object({ type: z.literal('sheet'), url: z.string() });
export const ButtonActionSchema = z.union([
  ButtonSubmitActionSchema,
  ButtonUrlActionSchema,
  ButtonSheetActionSchema,
]);

export const DropdownOptionSchema = z.object({
  type: z.literal('option'),
  id: z.string(),
  text: z.string(),
  disabled: z.boolean().optional(),
});

// Component schemas
export const TextComponentSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  text: z.string(),
  style: TextStyleSchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});

export const ButtonComponentSchema = z.object({
  type: z.literal('button'),
  id: z.string(),
  label: z.string(),
  style: ButtonStyleSchema.optional(),
  action: ButtonActionSchema,
  disabled: z.boolean().optional(),
});

export const DropdownComponentSchema = z.object({
  type: z.literal('dropdown'),
  id: z.string(),
  label: z.string().optional(),
  options: z.array(DropdownOptionSchema),
  value: z.string().optional(),
  disabled: z.boolean().optional(),
  save_state: z.enum(['unsaved', 'saved', 'failed']).optional(),
});

export const InputComponentSchema = z.object({
  type: z.literal('input'),
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  disabled: z.boolean().optional(),
  save_state: z.enum(['unsaved', 'saved', 'failed']).optional(),
});

export const SpacerComponentSchema = z.object({
  type: z.literal('spacer'),
  size: z.enum(['xs', 's', 'm', 'l', 'xl']),
});

export const DividerComponentSchema = z.object({
  type: z.literal('divider'),
});

export const ImageComponentSchema = z.object({
  type: z.literal('image'),
  id: z.string(),
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});

export const ListItemSchema = z.object({
  type: z.literal('item'),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  image_width: z.number().optional(),
  image_height: z.number().optional(),
  action: ButtonActionSchema.optional(),
  disabled: z.boolean().optional(),
});

export const ListComponentSchema = z.object({
  type: z.literal('list'),
  id: z.string().optional(),
  items: z.array(ListItemSchema),
  disabled: z.boolean().optional(),
});

export const CanvasComponentSchema = z.union([
  TextComponentSchema,
  ButtonComponentSchema,
  DropdownComponentSchema,
  InputComponentSchema,
  SpacerComponentSchema,
  DividerComponentSchema,
  ImageComponentSchema,
  ListComponentSchema,
]);

// =============================================================================
// Stored Data Schemas
// =============================================================================

/**
 * Stored data for recording canvas (Messenger)
 * Contains link information passed from configure flow
 */
export const RecordingCanvasStoredDataSchema = z.object({
  link_url: z.string(),
  link_title: z.string().optional(),
  custom_message: z.string().optional(),
  footer: z.string().nullable().optional(),
});

// =============================================================================
// Response Schemas
// =============================================================================

export const CanvasContentSchema = z.object({
  components: z.array(CanvasComponentSchema),
});

export const CanvasSchema = z.object({
  content: CanvasContentSchema,
  stored_data: z.record(z.unknown()).optional(),
});

export const CanvasResponseSchema = z.object({
  canvas: CanvasSchema,
  card_creation_options: CardCreationOptionsSchema.optional(),
});

export const ConfigureResponseSchema = z.object({
  results: CardCreationOptionsSchema,
});

// =============================================================================
// Derived Types (from Zod schemas)
// =============================================================================

// Entity types
export type IntercomTeammate = z.infer<typeof IntercomTeammateSchema>;
export type IntercomCustomer = z.infer<typeof IntercomCustomerSchema>;
export type IntercomConversation = z.infer<typeof IntercomConversationSchema>;

// Context types
export type MessengerLocation = z.infer<typeof MessengerLocationSchema>;
export type InboxLocation = z.infer<typeof InboxLocationSchema>;
export type CanvasLocation = MessengerLocation | InboxLocation;
export type MessengerCanvasContext = z.infer<typeof MessengerCanvasContextSchema>;
export type InboxCanvasContext = z.infer<typeof InboxCanvasContextSchema>;
export type CanvasContext = z.infer<typeof CanvasContextSchema>;

// Options types
export type CardCreationOptions = z.infer<typeof CardCreationOptionsSchema>;
export type CanvasInputValues = z.infer<typeof CanvasInputValuesSchema>;
export type RecordingCanvasStoredData = z.infer<typeof RecordingCanvasStoredDataSchema>;

// Request types
export type MessengerInitializeRequest = z.infer<typeof MessengerInitializeRequestSchema>;
export type InboxInitializeRequest = z.infer<typeof InboxInitializeRequestSchema>;
export type IntercomCanvasInitializeRequest = z.infer<typeof IntercomCanvasInitializeRequestSchema>;
export type IntercomCanvasConfigureRequest = z.infer<typeof IntercomCanvasConfigureRequestSchema>;
export type IntercomCanvasSubmitRequest = z.infer<typeof IntercomCanvasSubmitRequestSchema>;

// Component types
export type TextStyle = z.infer<typeof TextStyleSchema>;
export type ButtonStyle = z.infer<typeof ButtonStyleSchema>;
export type ButtonSubmitAction = z.infer<typeof ButtonSubmitActionSchema>;
export type ButtonUrlAction = z.infer<typeof ButtonUrlActionSchema>;
export type ButtonSheetAction = z.infer<typeof ButtonSheetActionSchema>;
export type ButtonAction = z.infer<typeof ButtonActionSchema>;
export type DropdownOption = z.infer<typeof DropdownOptionSchema>;
export type TextComponent = z.infer<typeof TextComponentSchema>;
export type ButtonComponent = z.infer<typeof ButtonComponentSchema>;
export type DropdownComponent = z.infer<typeof DropdownComponentSchema>;
export type InputComponent = z.infer<typeof InputComponentSchema>;
export type SpacerComponent = z.infer<typeof SpacerComponentSchema>;
export type DividerComponent = z.infer<typeof DividerComponentSchema>;
export type ImageComponent = z.infer<typeof ImageComponentSchema>;
export type ListItem = z.infer<typeof ListItemSchema>;
export type ListComponent = z.infer<typeof ListComponentSchema>;
export type CanvasComponent = z.infer<typeof CanvasComponentSchema>;

// Response types
export type CanvasContent = z.infer<typeof CanvasContentSchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type CanvasResponse = z.infer<typeof CanvasResponseSchema>;
export type ConfigureResponse = z.infer<typeof ConfigureResponseSchema>;

// =============================================================================
// Legacy Aliases (for backward compatibility during migration)
// =============================================================================

/** @deprecated Use IntercomTeammate instead */
export type IntercomAdmin = IntercomTeammate;

/** @deprecated Use IntercomCustomer instead */
export type IntercomUser = IntercomCustomer;
