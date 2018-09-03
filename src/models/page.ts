import { Widget } from "./widget";

export interface Page{
    id: string;

    type: string;

    projectId: string;
    gridWith: number;
    gridHeight: number;
    tab: string;
    widgets: Widget[];
}
