import { ProjectKeys } from './../models/projectKeys';
import { database } from './database';
import { Project } from './../models/project';
import { v4 } from 'uuid';
import * as crypto from 'crypto';
import { Collection } from 'mongodb';

export class ProjectService {
  async addProject(accountId: string, project: Project): Promise<Project> {
    const id = v4();
    const db = await database.connect();
    const projects = <Collection<Project>>db.collection('projects');
    const projectKeys = <Collection<ProjectKeys>>db.collection('projectKeys');

    project.id = id;
    project.accountId = accountId;

    const keys: ProjectKeys = {
      projectId: id,
      roJwtKey: crypto.randomBytes(64).toString('hex'),
      jwtKey: crypto.randomBytes(64).toString('hex'),
      userJwtKey: crypto.randomBytes(64).toString('hex')
    };

    const result = await Promise.all([projects.insertOne(project), projectKeys.insertOne(keys)]);

    return <Project>project;
  }

  async getAllProjects(accountId: string) {
    const db = await database.connect();
    const projects = <Collection<Project>>db.collection('projects');
    const result = projects.find({ accountId: accountId });
    return <Project[]>await result.toArray();
  }

  async getProject(accountId: string, id: string) {
    const db = await database.connect();
    const projects = <Collection<Project>>db.collection('projects');
    const result = await projects.findOne({ accountId: accountId, id: id });
    return <Project>result;
  }
}

export const projectService = new ProjectService();
