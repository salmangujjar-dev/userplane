import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import type { FieldError as RHFFieldError } from 'react-hook-form';

const fieldVariants = cva('space-y-1.5', {
  variants: {
    orientation: {
      vertical: 'flex flex-col',
      horizontal: 'flex flex-row items-center gap-2',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

interface FieldProps extends React.ComponentProps<'div'>, VariantProps<typeof fieldVariants> {}

function Field({ className, orientation, ...props }: FieldProps) {
  return (
    <div data-slot="field" className={cn(fieldVariants({ orientation }), className)} {...props} />
  );
}

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return <fieldset data-slot="fieldset" className={cn('space-y-4', className)} {...props} />;
}

const fieldLegendVariants = cva('', {
  variants: {
    variant: {
      default: 'text-lg font-semibold leading-none',
      label: 'text-sm font-medium leading-none',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface FieldLegendProps
  extends React.ComponentProps<'legend'>,
    VariantProps<typeof fieldLegendVariants> {}

function FieldLegend({ className, variant, ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      className={cn(fieldLegendVariants({ variant }), className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-group" className={cn('space-y-4', className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn('data-[invalid]:text-destructive', className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

interface FieldErrorProps extends React.ComponentProps<'p'> {
  errors?: RHFFieldError | RHFFieldError[];
}

function FieldError({ className, errors, children, ...props }: FieldErrorProps) {
  const errorArray = errors ? (Array.isArray(errors) ? errors : [errors]) : [];

  if (errorArray.length === 0 && !children) {
    return null;
  }

  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {children ||
        errorArray.map((error, index) => (
          <span key={index}>
            {error?.message}
            {index < errorArray.length - 1 && <br />}
          </span>
        ))}
    </p>
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="field-content" className={cn('flex-1 space-y-1.5', className)} {...props} />
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
};
