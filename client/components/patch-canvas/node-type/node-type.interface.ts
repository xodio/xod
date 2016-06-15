export interface INodeType {
	id: number,
	label: string,
	category: NodeCategory
}

export enum NodeCategory {
	Functional = 1,
	Hardware = 2,
	Configuration = 3,
	Watch = 4,
	Patch = 5
}