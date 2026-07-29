import jsep from 'jsep';

const SAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function validateNode(node: jsep.Expression): void {
  switch (node.type) {
    case 'Literal':
      return;

    case 'Identifier': {
      const name = (node as jsep.Identifier).name;
      if (!['data', 'true', 'false', 'null'].includes(name)) {
        throw new Error(`Unsupported identifier: ${name}`);
      }
      return;
    }

    case 'MemberExpression': {
      const member = node as jsep.MemberExpression;
      validateNode(member.object);
      if (member.computed) {
        validateNode(member.property);
      } else {
        const property = (member.property as jsep.Identifier).name;
        if (SAFE_KEYS.has(property)) {
          throw new Error(`Unsupported property: ${property}`);
        }
      }
      return;
    }

    case 'UnaryExpression': {
      const unary = node as jsep.UnaryExpression;
      if (!['!', '+', '-'].includes(unary.operator)) {
        throw new Error(`Unsupported unary operator: ${unary.operator}`);
      }
      validateNode(unary.argument);
      return;
    }

    case 'BinaryExpression': {
      const binary = node as jsep.BinaryExpression;
      if (
        !['&&', '||', '===', '==', '!==', '!=', '<', '<=', '>', '>='].includes(
          binary.operator,
        )
      ) {
        throw new Error(`Unsupported binary operator: ${binary.operator}`);
      }
      validateNode(binary.left);
      validateNode(binary.right);
      return;
    }

    default:
      throw new Error(`Unsupported expression node: ${node.type}`);
  }
}

function evaluateNode(
  node: jsep.Expression,
  data: Record<string, unknown>,
): unknown {
  switch (node.type) {
    case 'Literal':
      return (node as jsep.Literal).value;

    case 'Identifier': {
      const name = (node as jsep.Identifier).name;
      if (name === 'data') return data;
      if (name === 'true') return true;
      if (name === 'false') return false;
      if (name === 'null') return null;
      throw new Error(`Unsupported identifier: ${name}`);
    }

    case 'MemberExpression': {
      const member = node as jsep.MemberExpression;
      const owner = evaluateNode(member.object, data);
      const property = member.computed
        ? evaluateNode(member.property, data)
        : (member.property as jsep.Identifier).name;

      if (
        !owner ||
        (typeof owner !== 'object' && !Array.isArray(owner)) ||
        (typeof property !== 'string' && typeof property !== 'number') ||
        SAFE_KEYS.has(String(property))
      ) {
        return undefined;
      }

      return (owner as Record<string, unknown>)[String(property)];
    }

    case 'UnaryExpression': {
      const unary = node as jsep.UnaryExpression;
      const value = evaluateNode(unary.argument, data);
      if (unary.operator === '!') return !value;
      if (unary.operator === '+') return Number(value);
      if (unary.operator === '-') return -Number(value);
      throw new Error(`Unsupported unary operator: ${unary.operator}`);
    }

    case 'BinaryExpression': {
      const binary = node as jsep.BinaryExpression;
      const left = evaluateNode(binary.left, data);

      if (binary.operator === '&&') {
        return Boolean(left) && Boolean(evaluateNode(binary.right, data));
      }
      if (binary.operator === '||') {
        return Boolean(left) || Boolean(evaluateNode(binary.right, data));
      }

      const right = evaluateNode(binary.right, data);
      switch (binary.operator) {
        case '===':
        case '==':
          return left === right;
        case '!==':
        case '!=':
          return left !== right;
        case '<':
          return (left as number | string) < (right as number | string);
        case '<=':
          return (left as number | string) <= (right as number | string);
        case '>':
          return (left as number | string) > (right as number | string);
        case '>=':
          return (left as number | string) >= (right as number | string);
        default:
          throw new Error(`Unsupported binary operator: ${binary.operator}`);
      }
    }

    default:
      throw new Error(`Unsupported expression node: ${node.type}`);
  }
}

export function evaluateExpression(
  expression: string,
  data: Record<string, unknown>,
): boolean {
  try {
    const node = jsep(expression);
    validateNode(node);
    return Boolean(evaluateNode(node, data));
  } catch {
    return false;
  }
}

export function isSupportedExpression(expression: string): boolean {
  try {
    validateNode(jsep(expression));
    return true;
  } catch {
    return false;
  }
}
