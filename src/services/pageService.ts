import { database } from "./database";
import { Collection } from "mongodb";
import { Page } from "../models/page";
import {v4} from 'uuid';

export class PageService{
    async getAllPages(projectId: string, type: string){
        const db = await database.connect();
        const pages = <Collection<Page>>db.collection('pages');
        const result = pages.find({ projectId: projectId, type: type});
        return <Page[]>await result.toArray();
    }

    async updatePage(projectId: string, id: string, page: Page){
        const db = await database.connect();
        const pages = <Collection<Page>>db.collection('pages');
        delete page.projectId;
        delete page.type;
        delete page.id;
        const result = await pages.update({projectId, id},page);
        return page;
    }

    async createPage(projectId: string, type: string, page: Page){
        const db = await database.connect();
        const pages = <Collection<Page>>db.collection('pages');

        page.id = v4();
        page.projectId = projectId;
        // TODO: Validate that type exists
        page.type = type;

        await pages.insert(page);

        return page;
    }
}

export const pageService = new PageService()