/**
 * Inline-handler bridge.
 * index.html (and a few template strings) still use inline `onclick="fn()"` attributes, which can only
 * resolve globals. ES modules do not create globals, so every function referenced by an inline handler is
 * exposed on `window` here — in ONE place. When a handler is migrated to addEventListener, delete it from this list.
 */
import { closeBatchModal, deleteBatchStudent, exportBatchCsv, filterBatchTable, openBatchModal, selectBatchStudent } from '../../features/batch-manager/batch-manager.js';
import { setCampusTheme } from '../../features/campus-theme/campus-theme.js';
import { closeCardInspectModal, openCardInspectModal, switchInspectFace } from '../../features/card-preview/card-inspect.js';
import { toggleAudioFx, toggleHologramOverlay } from '../../features/card-preview/security-fx.js';
import { setIdVersion } from '../../features/id-generator/form-bindings.js';
import { flipCard, stepperBack, stepperNext } from '../../features/id-generator/stepper.js';
import { applyOcrResults, closeOcrModal, openOcrModal, runOcrScan } from '../../features/ocr/ocr.js';
import { clearUploadedSig, enhanceSignatureWithAI, switchSigMode } from '../../features/signature/ai-signature.js';
import { removeStudent } from '../../features/student-management/student-tabs.js';
import { hideMobileExportMenu, saveAsImage, showMobileExportMenu } from '../../services/export/image-export.js';
import { onDiscardSession, onRestoreSession } from '../../services/storage/session.js';

Object.assign(window, {
    applyOcrResults,
    clearUploadedSig,
    closeBatchModal,
    closeCardInspectModal,
    closeOcrModal,
    deleteBatchStudent,
    enhanceSignatureWithAI,
    exportBatchCsv,
    filterBatchTable,
    flipCard,
    hideMobileExportMenu,
    onDiscardSession,
    onRestoreSession,
    openBatchModal,
    openCardInspectModal,
    openOcrModal,
    removeStudent,
    runOcrScan,
    saveAsImage,
    selectBatchStudent,
    setCampusTheme,
    setIdVersion,
    showMobileExportMenu,
    stepperBack,
    stepperNext,
    switchInspectFace,
    switchSigMode,
    toggleAudioFx,
    toggleHologramOverlay,
});
