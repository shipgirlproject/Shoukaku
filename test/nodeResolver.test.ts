import { test } from 'node:test';
import assert from 'node:assert/strict';
import { State, ShoukakuDefaults } from '../src/Constants';

// Mock objects for testing
const createMockNode = (name: string, region: string | undefined, penalties: number, state = State.CONNECTED) => ({
    name,
    region,
    penalties,
    state,
});

test('Node Resolver Logic', async (t) => {
    const resolver = ShoukakuDefaults.nodeResolver;

    await t.test('should prioritize a node in the same region, even with higher penalties', () => {
        const nodes = new Map<string, any>([
            ['us-node', createMockNode('us-node', 'us-east', 50)],
            ['eu-node', createMockNode('eu-node', 'europe', 10)], // Better penalty, but wrong region
        ]);

        const mockConnection = { region: 'us-east' } as any;

        const idealNode = resolver(nodes, mockConnection);
        assert.strictEqual(idealNode?.name, 'us-node');
    });

    await t.test('should pick the lowest penalty node within the same region', () => {
        const nodes = new Map<string, any>([
            ['eu-node-1', createMockNode('eu-node-1', 'europe', 80)],
            ['eu-node-2', createMockNode('eu-node-2', 'europe', 20)], // Lowest penalty in region
            ['us-node', createMockNode('us-node', 'us-east', 5)],
        ]);

        const mockConnection = { region: 'europe' } as any;

        const idealNode = resolver(nodes, mockConnection);
        assert.strictEqual(idealNode?.name, 'eu-node-2');
    });

    await t.test('should fallback to the lowest penalty globally if no region matches', () => {
        const nodes = new Map<string, any>([
            ['us-node', createMockNode('us-node', 'us-east', 50)],
            ['eu-node', createMockNode('eu-node', 'europe', 10)],
        ]);

        const mockConnection = { region: 'japan' } as any;

        const idealNode = resolver(nodes, mockConnection);
        assert.strictEqual(idealNode?.name, 'eu-node'); // Picks Europe due to lower penalty
    });

    await t.test('should fallback to lowest penalty globally if connection region is undefined', () => {
        const nodes = new Map<string, any>([
            ['us-node', createMockNode('us-node', 'us-east', 50)],
            ['eu-node', createMockNode('eu-node', 'europe', 10)],
        ]);

        const mockConnection = { region: null } as any; // No region specified

        const idealNode = resolver(nodes, mockConnection);
        assert.strictEqual(idealNode?.name, 'eu-node');
    });

    await t.test('should ignore DISCONNECTED nodes', () => {
        const nodes = new Map<string, any>([
            ['us-node', createMockNode('us-node', 'us-east', 5, State.DISCONNECTED)], // Perfect match, but disconnected
            ['eu-node', createMockNode('eu-node', 'europe', 10)],
        ]);

        const mockConnection = { region: 'us-east' } as any;

        const idealNode = resolver(nodes, mockConnection);
        assert.strictEqual(idealNode?.name, 'eu-node'); // Falls back to connected nodes
    });
});
