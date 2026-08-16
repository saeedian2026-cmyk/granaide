from fastmcp import FastMCP

from lab01.surface import SurfaceTools

mcp = FastMCP("arena-surface")
tools = SurfaceTools()


@mcp.tool
def list_dir(path: str = ".") -> str:
    """List files under the candidate surface. Path is relative to the surface root."""
    return tools.list_dir(path)


@mcp.tool
def read_file(path: str) -> str:
    """Read one file from the candidate surface."""
    return tools.read_file(path)


@mcp.tool
def write_file(path: str, contents: str) -> str:
    """Write a file only if the scenario writable grant allows that path."""
    return tools.write_file(path, contents)


@mcp.tool
def localhost_get(url_path: str) -> str:
    """GET a path from the granted 127.0.0.1 fixture server. Public internet is refused."""
    return tools.localhost_get(url_path)


if __name__ == "__main__":
    mcp.run()
