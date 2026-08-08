// Entry point injected into every *.myworkdayjobs.com page.
// Mounts the AutofillController, which owns Navigator/Parser/Filler/Mapper wiring.

import { AutofillController } from "./orchestrator/AutofillController";

const controller = new AutofillController();
controller.start();
