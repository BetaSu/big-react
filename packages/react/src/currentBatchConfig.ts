interface BatchConfig {
	transition: number | null;
}

const ReactCurrentBatchConfig: BatchConfig = {
	transition: null
};

export default ReactCurrentBatchConfig;
