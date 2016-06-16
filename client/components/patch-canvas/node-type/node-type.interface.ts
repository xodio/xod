export interface IPin {
	name: string,
	type: PinType,

	description?: string,
	label?: string,
	defaultValue?: any
}

export interface INodeType {
	id: number,
	label: string,
	category: NodeCategory,
	inputs: IPin[],
	outputs: IPin[]
}

export enum NodeCategory {
	Null = 0,
	Functional = 1,
	Hardware = 2,
	Configuration = 3,
	Watch = 4,
	Patch = 5
}

export enum PinType {
	Any = 0,
	Bool = 1,
	Number = 2,
	String = 3,
	Event = 4,
	Trigger = 5,
	Set = 6
}