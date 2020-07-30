"use strict";
// Copyright 2017-2020 @polkadot/app-accounts authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslation = void 0;
const react_i18next_1 = require("react-i18next");
function useTranslation() {
    return react_i18next_1.useTranslation('app-doughnut');
}
exports.useTranslation = useTranslation;
exports.default = react_i18next_1.withTranslation(['app-doughnut']);
