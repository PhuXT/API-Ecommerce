import { Document } from 'mongoose';
import { ICategory } from './entity/categories.entity';

export interface ICategoriesModel extends Document, ICategory {}
