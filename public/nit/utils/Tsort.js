module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Tsort"))
        .m ("error.failed_sort", "Failed to sort the following nodes: %{nodes.join (', ')}")
        .defineInnerClass ("Node", function (Node)
        {
            Node
                .field ("<owner>", "any", "The owner.")
                .field ("[dependencies...]", "any", "The dependencies.")
            ;
        })
        .property ("nodes...", Self.Node.name)

        .method ("getNode", function (owner)
        {
            return nit.find (this.nodes, "owner", owner);
        })
        .method ("add", function (owner, dependencies)
        {
            var self = this;
            var node = self.getNode (owner);

            dependencies = nit.array (arguments, true).slice (1);

            if (!node)
            {
                self.nodes.push (new Self.Node ({ owner: owner, dependencies: dependencies }));
            }
            else
            {
                dependencies.forEach (function (d)
                {
                    if (!~node.dependencies.indexOf (d))
                    {
                        node.dependencies.push (d);
                    }
                });
            }

            dependencies.forEach (function (d) { self.add (d); });

        })
        .method ("addEdge", function (from, tos) // eslint-disable-line no-unused-vars
        {
            var self = this;

            self.add (from);

            nit.array (arguments, true)
                .slice (1)
                .forEach (function (t)
                {
                    self.add (t, from);
                })
            ;
        })
        .method ("sort", function ()
        {
            var sorted = [];
            var nodes = this.nodes.slice ();

            while (nodes.length)
            {
                var nodeWithoutDeps = [];

                nodes = nodes.filter (function (n)
                {
                    if (n.dependencies.length)
                    {
                        return true;
                    }
                    else
                    {
                        nodeWithoutDeps.push (n);

                        return false;
                    }
                });

                sorted.push.apply (sorted, nodeWithoutDeps);

                if (nodeWithoutDeps.length)
                {
                    nodeWithoutDeps.forEach (function (d)
                    {
                        nodes.forEach (function (o) { nit.arrayRemove (o.dependencies, d.owner); });
                    });
                }
                else
                {
                    break;
                }
            }

            if (nodes.length)
            {
                this.throw ("error.failed_sort", { nodes: nodes.map (function (n) { return n.owner; }) });
            }
            else
            {
                return sorted.map (function (n) { return n.owner; });
            }
        })
    ;
};
