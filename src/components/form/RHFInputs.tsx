import { ArrayPath, Controller, FieldValues, Path, UseFormReturn } from "react-hook-form";
import React, { PropsWithChildren } from "react";
import _, { isArray } from "lodash";
import "./rhf-inputs.scss";
import Tippy from "@tippyjs/react";

export type SimpleInputProps<T extends FieldValues> = {
    form: UseFormReturn<T>;
    fieldName: Path<T>;
    label: string;
    required: string | boolean;
    pattern?: { value: RegExp; message: string };
    onBlur?: (event: any) => void;
    className?: string;
    disabled?: boolean;
    tooltip?: string;
};

type NumberInputProps<T extends FieldValues> = SimpleInputProps<T> & {
    step?: number;
    min?: number;
    max?: number;
};

type ArrayInputProps<T extends FieldValues> = {
    form: UseFormReturn<T>;
    fieldName: Path<T>;
    label: string;
    defaultValue: any;
    className?: string;
    options?: Array<{ key: string; value: string }>;
};

export type InputFieldProps<T extends FieldValues> = {
    fieldKey: string;
    label: string;
    description?: string;
    required: boolean | string;
    // for some reason combining two different InputProps is disliked by the compiler on assignment
    input: (props: any) => React.JSX.Element;
    className?: string;
    options?: Array<{ key: string; value: string }>;
    items?: Array<{ fieldName: string; label: string }>;
    objectArray?: Partial<ListInputProps<T>>;
    multiple?: boolean;
    currentValues?: any;
    form?: UseFormReturn<T>;
    needsLabel?: boolean;
    tooltip?: string;
};

type SelectInputProps<T extends FieldValues> = SimpleInputProps<T> & {
    options: Array<{ key: string; value: string }>;
    multiple?: boolean;
};

export type ListInputProps<T extends FieldValues> = PropsWithChildren & {
    form: UseFormReturn<T>;
    fieldName: ArrayPath<T>;
    label: string;
    required: string | boolean;
    inputFields: Array<InputFieldProps<T>>;
    defaultValue: any;
    currentValues: any | null;
    pattern?: { value: RegExp; message: string };
    onBlur?: (event: any) => void;
    className?: string;
};

type CheckListProps<T extends FieldValues> = {
    form: UseFormReturn<T>;
    items: Array<{
        fieldName: Path<T>;
        label: string;
        onBlur?: (event: any) => void;
        disabled?: boolean;
        tooltip?: string;
    }>;
    className?: string;
};

export const TextInput = <T extends FieldValues>(props: SimpleInputProps<T>) => {
    const error = _.get(props.form.formState.errors, props.fieldName);
    return (
        <label aria-label={props.label} className={`${props.fieldName} ${props.className}`}>
            <Tippy content={props.tooltip} disabled={!props.tooltip}>
                <div>
                    <input
                        className={`${error ? "input-error" : ""} ${props.className}`}
                        type={"text"}
                        {...props.form.register(props.fieldName, {
                            required: props.required,
                            pattern: props.pattern,
                            onBlur: props.onBlur,
                            disabled: props.disabled,
                        })}
                    />
                    {error && <span className={"error"}>{error.message?.toString()}</span>}
                </div>
            </Tippy>
        </label>
    );
};

export const DateInput = <T extends FieldValues>(props: SimpleInputProps<T>) => {
    const error = _.get(props.form.formState.errors, props.fieldName);
    return (
        <label aria-label={props.label} className={`${props.fieldName} ${props.className}`}>
            <input
                className={`${error ? "input-error" : ""} ${props.className}`}
                type={"date"}
                {...props.form.register(props.fieldName, {
                    required: props.required,
                    pattern: props.pattern,
                    onBlur: props.onBlur,
                    disabled: props.disabled,
                })}
            />
            {error && <span className={"error"}>{error.message?.toString()}</span>}
        </label>
    );
};

export const NumberInput = <T extends FieldValues>(props: NumberInputProps<T>) => {
    const error = _.get(props.form.formState.errors, props.fieldName);
    return (
        <label aria-label={props.label} className={`${props.fieldName} ${props.className}`}>
            <input
                className={`${error ? "input-error" : ""} ${props.className}`}
                type={"number"}
                step={props.step || 1}
                min={props.min || -100}
                max={props.max || 1000000}
                {...props.form.register(props.fieldName, {
                    required: props.required,
                    valueAsNumber: true,
                    onBlur: props.onBlur,
                    disabled: props.disabled,
                })}
            />
            {error && <span className={"error"}>{error.message?.toString()}</span>}
        </label>
    );
};

export const CheckboxInput = <T extends FieldValues>(props: SimpleInputProps<T>) => {
    const error = _.get(props.form.formState.errors, props.fieldName);
    return (
        <Tippy content={props.tooltip} disabled={!props.tooltip}>
            <label aria-label={props.label} className={`${props.fieldName} ${props.className}`}>
                <input
                    className={`${error ? "input-error" : ""} ${props.className}`}
                    type={"checkbox"}
                    {...props.form.register(props.fieldName, {
                        required: props.required,
                        onBlur: props.onBlur,
                        disabled: props.disabled,
                    })}
                />
                {error && <span className={"error"}>{error.message?.toString()}</span>}
            </label>
        </Tippy>
    );
};

export const SelectInput = <T extends FieldValues>(props: SelectInputProps<T>) => {
    const error = _.get(props.form.formState.errors, props.fieldName);
    return (
        <label aria-label={props.label} className={props.className}>
            <div className={"select-wrapper"}>
                <select
                    className={`${error ? "input-error" : ""} ${props.className}`}
                    {...props.form.register(props.fieldName, {
                        required: props.required,
                        disabled: props.disabled,
                    })}
                    multiple={props.multiple ?? false}
                >
                    {!props.multiple ? <option value={""}></option> : null}
                    {props.options.map((option, index) => {
                        return (
                            <option key={`${option.key}-${index}`} value={option.key}>
                                {option.value}
                            </option>
                        );
                    })}
                </select>
            </div>
            {error && <span className={"error"}>{error.message?.toString()}</span>}
        </label>
    );
};

export const StringArrayInput = <T extends FieldValues>(props: ArrayInputProps<T>) => {
    const error = _.get(props.form.formState.errors, props.fieldName);
    return (
        <Controller
            name={props.fieldName}
            control={props.form.control}
            render={({ field }) => {
                const values = field.value;
                return (
                    <>
                        {isArray(values)
                            ? values.map((value: string, index: number) => {
                                  return (
                                      <div className={props.className} key={index}>
                                          {props.options ? (
                                              <select
                                                  value={value}
                                                  onChange={(e) => {
                                                      const currentValues: Array<string> = Array.from(values);
                                                      currentValues.splice(index, 1, e.currentTarget.value);
                                                      field.onChange(currentValues);
                                                  }}
                                              >
                                                  <option></option>
                                                  {props.options.map((option, index) => {
                                                      return (
                                                          <option key={`${option.key}-${index}`} value={option.key}>
                                                              {option.value}
                                                          </option>
                                                      );
                                                  })}
                                              </select>
                                          ) : (
                                              <input
                                                  type={"text"}
                                                  value={value}
                                                  onChange={(e) => {
                                                      const currentValues: Array<string> = Array.from(values);
                                                      currentValues.splice(index, 1, e.currentTarget.value);
                                                      field.onChange(currentValues);
                                                  }}
                                                  onBlur={(e: any) => {
                                                      const currentValues: Array<string> = Array.from(values);
                                                      currentValues.splice(index, 1, e.currentTarget.value);
                                                      field.onChange(currentValues);
                                                  }}
                                              />
                                          )}
                                          <button
                                              type={"button"}
                                              className={"remove"}
                                              onClick={() => {
                                                  const currentValues: Array<string> = Array.from(values);
                                                  currentValues.splice(index, 1);
                                                  field.onChange(currentValues);
                                              }}
                                          >
                                              -
                                          </button>
                                      </div>
                                  );
                              })
                            : null}
                        <button
                            type={"button"}
                            className={"add"}
                            onClick={() => {
                                const currentValues: Array<string> = isArray(values) ? Array.from(values) : [];
                                currentValues.push(props.defaultValue);
                                field.onChange(currentValues);
                            }}
                        >
                            +
                        </button>
                        {error && <span className={"error"}>{error.message?.toString()}</span>}
                    </>
                );
            }}
        />
    );
};

export const Checklist = <T extends FieldValues>(props: CheckListProps<T>) => {
    return (
        <ul className={`checklist ${props.className}`}>
            {props.items.map((item, index) => {
                const error = _.get(props.form.formState.errors, item.fieldName);
                return (
                    <li className={"checklist-item"} key={index}>
                        <label aria-label={item.label}>
                            <Tippy content={item.tooltip} disabled={!item.tooltip}>
                                <input
                                    className={`${error ? "input-error" : ""} ${props.className}`}
                                    type={"checkbox"}
                                    {...props.form.register(item.fieldName, {
                                        onBlur: item.onBlur,
                                        disabled: item.disabled,
                                    })}
                                />
                            </Tippy>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export const TextInputConst = TextInput;
export const StringArrayInputConst = StringArrayInput;
export const NumberInputConst = NumberInput;
export const SelectInputConst = SelectInput;
export const CheckListConst = Checklist;
export const CheckboxInputConst = CheckboxInput;
