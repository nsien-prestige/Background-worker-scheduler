import { Injectable } from "@nestjs/common";
import { JobModelAction } from "./actions/job.action";

@Injectable()
export class JobsService {
    constructor(private readonly jobAction: JobModelAction) {}
}