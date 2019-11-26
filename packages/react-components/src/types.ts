// Copyright 2017-2019 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { WithTranslation } from 'react-i18next';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { Abi } from '@polkadot/api-contract';
import { ActionStatus } from '@polkadot/react-components/Status/types';
import { InputAddressProps } from '@polkadot/react-components/InputAddress/types';
import { IExtrinsic } from '@polkadot/types/types';
import { ApiProps } from '@polkadot/react-api/types';
import { Index } from '@polkadot/types/interfaces';
import { ButtonProps, Button$Sizes } from './Button/types';
import { TxCallback, TxFailedCallback } from './Status/types';

export interface BareProps {
  className?: string;
  style?: Record<string, string | number>;
}

export interface AppProps {
  basePath: string;
  onStatusChange: (status: ActionStatus) => void;
}

export type I18nProps = BareProps & WithTranslation;

interface FormProps$Refs {
  cancelButtonRef?: React.RefObject<React.Component<ButtonProps>>;
  submitButtonRef?: React.RefObject<React.Component<ButtonProps>>;
}

interface FormProps$Hooks {
  onInputEnterKey: () => void;
  onInputEscapeKey: () => void;
}

export interface FormProps extends FormProps$Refs, FormProps$Hooks {}

export type ConstructTxFn = () => any[];

export interface TxTriggerProps {
  onOpen: () => void;
}

export interface TxButtonInterface {
  component?: {
    current?: {
      send: () => void;
    };
  };
}

export interface TxProps {
  extrinsic?: IExtrinsic | SubmittableExtrinsic | null;
  tx?: string;
  params?: any[] | ConstructTxFn;
}

export interface TxButtonProps extends TxProps, ApiProps {
  accountId?: string;
  accountNonce?: Index;
  className?: string;
  icon: string;
  iconSize?: Button$Sizes;
  innerRef?: React.RefObject<React.Component<ButtonProps>>;
  isBasic?: boolean;
  isDisabled?: boolean;
  isNegative?: boolean;
  isPrimary?: boolean;
  isUnsigned?: boolean;
  label: React.ReactNode;
  onClick?: () => any;
  onFailed?: TxFailedCallback;
  onStart?: () => void;
  onSuccess?: TxCallback;
  onUpdate?: TxCallback;
  tooltip?: string;
  withSpinner?: boolean;
}

export interface TxModalProps extends I18nProps, TxProps, FormProps$Refs {
  accountId?: StringOrNull;
  header?: React.ReactNode;
  isDisabled?: boolean;
  isOpen?: boolean;
  isUnsigned?: boolean;
  isSubmittable?: boolean;
  content: React.ReactNode;
  preContent?: React.ReactNode;
  trigger?: React.ComponentType<TxTriggerProps>;
  onChangeAccountId?: (_: StringOrNull) => void;
  onSubmit?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onSuccess?: () => void;
  onFailed?: () => void;
  modalProps?: {
    [index: string]: any;
  };
  inputAddressHelp?: React.ReactNode;
  inputAddressLabel?: React.ReactNode;
  inputAddressProps?: Pick<InputAddressProps, never>;
  cancelButtonLabel?: React.ReactNode;
  cancelButtonProps?: Pick<ButtonProps, never>;
  submitButtonLabel?: React.ReactNode;
  submitButtonProps?: Pick<TxButtonProps, never>;
}

export type BitLength = 8 | 16 | 32 | 64 | 128 | 256;

export type StringOrNull = string | null;

interface ContractBase {
  abi: Abi;
}

export interface Contract extends ContractBase {
  address: null;
}

export interface ContractDeployed extends ContractBase {
  address: string;
}

export type CallContract = ContractDeployed;

export interface NullContract {
  abi: null;
  address: null;
}
